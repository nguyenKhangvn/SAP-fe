# Dashboard Styles

This directory contains the CSS files for the dashboard component, organized into modular files to keep each file under 300 lines and enable reuse.

## Files Organization

- `dashboard.component.css` - Main CSS file with imports (only 6 lines)
- `dashboard-layout.css` - General dashboard layout and container styles
- `dashboard-tables.css` - Styles specific to the dashboard tables
- `dashboard-cards.css` - Styles for summary cards and inventory card
- `dashboard-charts.css` - Styles for chart components
- `dashboard-v1.component.css` - Legacy version that imports the same modular CSS files

## Shared Styles

Reusable styles are stored in the shared directory:
- `../shared/responsive-tables.css` - Mobile-friendly table styles
- `../shared/responsive-layouts.css` - Reusable responsive grid layouts

## Mobile Responsiveness

All files include responsive design for mobile devices with:
- Card-based table views for small screens
- Adjusted spacing and sizing for mobile devices
- Single-column layouts for narrow viewports

## How This Works

The modular approach allows:
1. Each CSS file to remain under 300 lines
2. Reuse of common styles across components
3. Better organization of related styles
4. Easier maintenance and updates
