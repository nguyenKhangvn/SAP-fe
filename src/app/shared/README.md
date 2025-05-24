# Shared Styles

This directory contains shared CSS files that can be reused across multiple components in the application.

## Available Styles

- `responsive-tables.css` - Mobile-friendly table styles for transforming tables into card views on small screens
- `responsive-layouts.css` - Reusable grid layouts and responsive containers for mobile-friendly interfaces
- Other shared styles will be added here as needed

## How to Use

Import these styles in your component CSS file:

```css
@import '../shared/responsive-tables.css';
@import '../shared/responsive-layouts.css';
```

### Using Responsive Tables

Remember to add the appropriate data-label attributes to your table cells in your HTML:

```html
<td mat-cell *matCellDef="let item" data-label="Column Name">{{ item.property }}</td>
```

### Using Responsive Layouts

For responsive grids:
```html
<div class="responsive-grid">
  <mat-card>Content 1</mat-card>
  <mat-card>Content 2</mat-card>
</div>
```

For responsive headers:
```html
<div class="responsive-header">
  <h1>Page Title</h1>
  <div class="responsive-actions">
    <button mat-button>Action</button>
  </div>
</div>
```
