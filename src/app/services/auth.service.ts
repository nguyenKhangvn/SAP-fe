import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';
import { jwtDecode as jwt_decode } from 'jwt-decode';

interface TokenPayload {
  sub: string;
  username: string;
  role: string;
  exp: number;
  iat: number;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.apiUrl + '/users';
  private tokenKey = 'token';
  private userInfoKey = 'user_info';

  constructor(
    private http: HttpClient, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, { username, password }).pipe(
      tap((res: any) => {
        if (res && res.token) {
          this.setToken(res.token);
        }
      })
    );
  }

  logout(): Observable<any> {
    // Try to call logout endpoint, but proceed with local logout even if it fails
    return new Observable(observer => {
      this.http.post(`${this.baseUrl}/logout`, {}).subscribe({
        next: (res) => {
          this.clearStorage();
          observer.next(res);
          observer.complete();
        },
        error: (err) => {
          // Still clear storage and redirect even if API fails
          this.clearStorage();
          observer.next({ success: true });
          observer.complete();
        }
      });
    });
  }

  // For manual token injection during development/testing
  setManualToken(token: string): Observable<boolean> {
    try {
      // Validate token format first
      if (!token || !this.isValidJwtFormat(token)) {
        return of(false);
      }
      
      // Store the token
      this.setToken(token);
      return of(true);
    } catch (error) {
      console.error('Invalid token format', error);
      return of(false);
    }
  }

  // Check if logged in with a valid token
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const decoded = this.decodeToken(token);
      // Check if token is expired
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        this.clearStorage();
        return false;
      }
      return true;
    } catch (error) {
      this.clearStorage();
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUserInfo(): any {
    const userInfoString = localStorage.getItem(this.userInfoKey);
    if (userInfoString) {
      try {
        return JSON.parse(userInfoString);
      } catch (e) {
        return null;
      }
    }
    
    // If user info isn't cached, try to get it from the token
    const token = this.getToken();
    if (token) {
      try {
        const decoded = this.decodeToken(token);
        return {
          username: decoded.username,
          role: decoded.role,
          userId: decoded.sub
        };
      } catch (e) {
        return null;
      }
    }
    
    return null;
  }

  getUserRole(): string | null {
    const userInfo = this.getUserInfo();
    return userInfo ? userInfo.role : null;
  }

  // Private helper methods
  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    
    try {
      // Extract and store user info from token
      const decoded = this.decodeToken(token);
      const userInfo = {
        username: decoded.username,
        role: decoded.role,
        userId: decoded.sub
      };
      localStorage.setItem(this.userInfoKey, JSON.stringify(userInfo));
    } catch (error) {
      console.error('Error decoding token', error);
    }
  }
  private clearStorage(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userInfoKey);
    // Always redirect to login page after logout
    this.router.navigate(['/login']);
  }

  private decodeToken(token: string): TokenPayload {
    return jwt_decode<TokenPayload>(token);
  }

  private isValidJwtFormat(token: string): boolean {
    // Basic format check for JWT (3 parts separated by dots)
    const parts = token.split('.');
    return parts.length === 3;
  }
}
