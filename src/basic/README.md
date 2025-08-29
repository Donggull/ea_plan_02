# My Design System

Generated design system with 27 components.

## Installation

```bash
npm install my-design-system
```

## Usage

```jsx
import { Button, Input, Card, Modal, Typography, Enhanced Button, Enhanced Input, Enhanced Modal, Table, Badge, Avatar, Toast, Grid, Divider, Tabs, Notification, Banner, Pagination, Accordion, Carousel, Bar Chart, Line Chart, Pie Chart, Profile Card, Product Card, Blog Card, Gallery } from 'my-design-system'

function App() {
  return (
    <div>
      <Button>Button</Button>
      <Input>Input</Input>
      <Card>Card</Card>
    </div>
  )
}
```

## Components

### Button

Basic button component with variants

**Props:**

- `variant` (string, optional): Button visual variant
- `size` (string, optional): Button size


### Input

Basic input field component

**Props:**

- `variant` (string, optional): Input visual variant
- `inputSize` (string, optional): Input size


### Card

Basic card container component

**Props:**

- `variant` (string, optional): Card visual variant


### Modal

Basic modal dialog component

**Props:**

- `isOpen` (boolean, required): Modal visibility state


### Typography

Typography component for text styling

**Props:**

- `variant` (string, optional): Typography variant


### Enhanced Button

Enhanced button with accessibility, loading states, and icon support

**Props:**

- `variant` (string, optional): Button visual variant
- `size` (string, optional): Button size
- `loading` (boolean, optional): Show loading state with spinner
- `fullWidth` (boolean, optional): Make button full width


### Enhanced Input

Enhanced input with icons, clear functionality, and improved accessibility

**Props:**

- `variant` (string, optional): Input visual variant
- `clearable` (boolean, optional): Show clear button when input has value


### Enhanced Modal

Enhanced modal with focus trap, keyboard navigation, and accessibility features

**Props:**

- `size` (string, optional): Modal size
- `closeOnOverlayClick` (boolean, optional): Close modal when clicking outside
- `preventBodyScroll` (boolean, optional): Prevent body scrolling when modal is open


### Table

Data table with sorting and pagination support

**Props:**

- `variant` (string, optional): Table visual variant
- `size` (string, optional): Table size


### Badge

Status badge for displaying small pieces of information

**Props:**

- `variant` (string, optional): Badge color variant
- `size` (string, optional): Badge size
- `rounded` (boolean, optional): Rounded badge style


### Avatar

User avatar with fallback support

**Props:**

- `size` (string, optional): Avatar size
- `variant` (string, optional): Avatar shape


### Toast

Toast notification for user feedback

**Props:**

- `variant` (string, optional): Toast notification type
- `duration` (number, optional): Auto-close duration in milliseconds


### Grid

Responsive grid layout system

**Props:**

- `cols` (number, optional): Number of grid columns
- `gap` (string, optional): Grid gap size


### Divider

Visual divider for content separation

**Props:**

- `orientation` (string, optional): Divider orientation
- `variant` (string, optional): Divider line style


### Tabs

Tabbed navigation component

**Props:**

- `variant` (string, optional): Tabs visual style
- `size` (string, optional): Tabs size


### Notification

Rich notification with actions and positioning

**Props:**

- `variant` (string, optional): Notification type
- `position` (string, optional): Notification position


### Banner

Full-width banner for important announcements

**Props:**

- `variant` (string, optional): Banner variant
- `dismissible` (boolean, optional): Allow banner dismissal


### Pagination

Pagination component for data navigation

**Props:**

- `pageSize` (number, optional): Number of items per page
- `showSizeChanger` (boolean, optional): Show page size selector
- `showQuickJumper` (boolean, optional): Show quick page jumper


### Accordion

Collapsible content panels

**Props:**

- `multiple` (boolean, optional): Allow multiple panels to be open
- `variant` (string, optional): Accordion visual style


### Carousel

Image and content carousel with navigation

**Props:**

- `autoplay` (boolean, optional): Auto-advance slides
- `autoplayDelay` (number, optional): Autoplay delay in milliseconds
- `infinite` (boolean, optional): Infinite scrolling


### Bar Chart

Customizable bar chart with multiple variants

**Props:**

- `orientation` (string, optional): Chart orientation
- `variant` (string, optional): Bar visual style
- `showValues` (boolean, optional): Show values on bars


### Line Chart

Line chart with smooth curves and interactive dots

**Props:**

- `smooth` (boolean, optional): Use smooth curves
- `showDots` (boolean, optional): Show data points
- `showGrid` (boolean, optional): Show grid lines


### Pie Chart

Pie/donut chart with legend and interactive segments

**Props:**

- `innerRadius` (number, optional): Inner radius for donut chart
- `showLegend` (boolean, optional): Show legend
- `showLabels` (boolean, optional): Show percentage labels


### Profile Card

Profile card component with avatar, cover image, and user information

**Props:**

- `variant` (string, optional): Profile card layout variant
- `name` (string, required): Person name
- `title` (string, required): Job title or role


### Product Card

E-commerce product card with image, pricing, and rating

**Props:**

- `variant` (string, optional): Product card layout variant
- `title` (string, required): Product title
- `price` (string, required): Product price


### Blog Card

Blog post card with featured image, author info, and metadata

**Props:**

- `variant` (string, optional): Blog card layout variant
- `title` (string, required): Article title
- `excerpt` (string, required): Article excerpt


### Gallery

Image gallery with grid, masonry, and carousel layouts

**Props:**

- `variant` (string, optional): Gallery layout variant
- `columns` (number, optional): Number of columns for grid layout



## Design Tokens

This design system uses CSS custom properties for theming:

```css
:root {
  --color-primary-500: 220 100% 50%;
  --font-family: Inter, system-ui, sans-serif;
  --spacing-md: 1rem;
  --border-radius-md: 0.375rem;
}
```

## Development

```bash
# Run Storybook
npm run storybook

# Run tests
npm test

# Build package
npm run build
```

---

Generated with [Claude Code Design System Generator](https://github.com/Donggull/ed_system_new)
