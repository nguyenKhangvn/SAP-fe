# CSS Organization in Shop Management App

This document describes the CSS organization strategy used in this application to ensure maintainability, reusability, and mobile-friendly design.

## Key Principles

1. **Modular Files**: Each CSS file is limited to 300 lines maximum
2. **Reusable Styles**: Common styles are extracted to shared files
3. **Mobile-First Design**: All components are responsive on mobile devices
4. **Import-Based Structure**: Component CSS files import shared styles

## Directory Structure

### Shared Styles
Located in `src/app/shared/`
- `responsive-tables.css`: Mobile-friendly table transformations
- `responsive-layouts.css`: Reusable grid and layout components

### Component-Specific Styles
Each component has its own CSS files in its respective directory.
Complex components may have multiple CSS files, each focused on a specific aspect:

Example: Dashboard
- `dashboard.component.css`: Main file with imports
- `dashboard-layout.css`: Layout styles
- `dashboard-tables.css`: Table-specific styles
- `dashboard-cards.css`: Card component styles
- `dashboard-charts.css`: Chart component styles

## Mobile Responsiveness

The application uses several strategies to ensure mobile friendliness:
- Tables transform into card views on small screens
- Grid layouts adjust to single columns on mobile
- Font sizes and spacing are reduced on small screens
- Touch-friendly padding for interactive elements

## How to Use This Organization

When developing new components:

1. Keep each CSS file under 300 lines
2. Extract reusable styles to shared files
3. Use imports to include shared styles
4. Use data-label attributes on table cells for mobile views
5. Test responsiveness on mobile devices
6. Use responsive utilities from shared CSS files

## Example Implementation

```css
/* Component CSS file */
@import '../shared/responsive-tables.css';
@import '../shared/responsive-layouts.css';

/* Component-specific styles */
.my-component {
  /* styles here */
}
```

With HTML:
```html
<div class="responsive-grid">
  <mat-card class="card-responsive">
    <table>
      <tr>
        <td data-label="Name">Example</td>
      </tr>
    </table>
  </mat-card>
</div>
```
