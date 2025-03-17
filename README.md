This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.1.8.

# Ng2MultiModal

A powerful Angular Signals base multi-modal component library that supports provideExperimentalZonelessChangeDetection() configuration and removed zone.js.
Support dragging, resizing, maximizing, minimizing, and various comprehensive modal functions. It supports creation through both declarative templates and service methods, complete modal lifecycle management, and highly customizable styles.

# screenshot

![screenshot](https://github.com/adriandy89/ng2-multi-modal/blob/master/public/screenshot.png?raw=true)

## Installation

To install `ng2-multi-modal`, run:

```bash
npm install ng2-multi-modal --save
```

# Dependencies

Latest version available for each version of Angular

| ng2-multi-modal | Angular     |
|-----------------| ------------|
| 1.0.3           | 19.0.0+     |

## Usage

Then add `Ng2MultiModalComponent` and `Ng2MultiModalService` to your standalone app's component imports:

```typescript
    imports: [Ng2MultiModalComponent],
    providers: [Ng2MultiModalService]
```

Required for animations:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [provideAnimations()]
};
```

Using the service to create modals dynamically:

```typescript
import { Ng2MultiModalService } from "ng2-multi-modal";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
    standalone: true,
    imports: [Ng2MultiModalComponent],
    providers: [Ng2MultiModalService]
})
export class AppComponent {
  readonly theme = model<'light' | 'dark'>('dark');
  tpl = viewChild.required('tpl', {
    read: TemplateRef,
  });

  modals: {
    [key: string]: {
      modal: Ng2MultiModalComponent | null,
      visible: boolean,
    };
  } = {};

  constructor(private _modal: Ng2MultiModalService) {
    effect(() => {
      this._modal.dockTheme.set(this.theme());
    });
  }

  toggleTheme() {
    this.theme.update(prev => (prev === 'light' ? 'dark' : 'light'));
  }

  openModal() {
    this._modal.create({
      content: this.tpl(),
      theme: this.theme
    }).then((modal: Ng2MultiModalComponent) => {
      const key = modal.modalId();
      this.modals[key] = {
        modal,
        visible: true,
      };
      modal.maximized.set(false);
      modal.onClose.subscribe(() => {
        this.modals[key].visible = false;
        this.modals[key].modal = null
      });
    });
  }
}
```

Using the component in your template:

```html
<ng2-multi-modal>
    <ng-template #content>
        <!-- Modal content here -->
    </ng-template>
</ng2-multi-modal>
```

## Features

- Draggable modals
- Resizable modals
- Maximize/minimize functionality
- Multiple modals with z-index handling
- Light and dark themes
- Comprehensive modal lifecycle management
- Highly customizable styles and behaviors
- Angular 19+ signals API support

## API

### Ng2MultiModalComponent

#### Inputs/Model Signals

- `title` (string/TemplateRef): Modal title
- `icon` (string/TemplateRef): Modal icon
- `align` ('leftTop'/'rightTop'/'leftBottom'/'rightBottom'): Modal alignment
- `width` (number): Modal width
- `height` (number): Modal height
- `minWidth` (number): Minimum modal width
- `minHeight` (number): Minimum modal height
- `offsetX` (number): X position offset
- `offsetY` (number): Y position offset
- `closable` (boolean): Whether the modal can be closed
- `canMaximize` (boolean): Whether the modal can be maximized
- `canMinimize` (boolean): Whether the modal can be minimized
- `resizable` (boolean): Whether the modal can be resized
- `outOfBounds` (boolean): Whether the modal can be dragged outside viewport
- `draggable` (boolean): Whether the modal can be dragged
- `loading` (boolean): Whether to show loading state
- `loadingTip` (string/TemplateRef): Loading message/template
- `content` (TemplateRef): Modal content
- `contentScrollable` (boolean): Whether content can scroll
- `theme` ('light'/'dark'): Modal theme
- `zIndex` (number): Modal stacking order
- `bodyStyle` (object): Custom styles for modal body
- `closeOnNavigation` (boolean): Close modal when route changes
- `minimized` (boolean): Whether the modal is minimized
- `maximized` (boolean): Whether the modal is maximized

#### Outputs Signals

- `onClose`: Emitted when modal closes
- `onResize`: Emitted when modal is resized
- `onMaximize`: Emitted when modal is maximized
- `onMaximizeRestore`: Emitted when maximized modal is restored
- `onMinimize`: Emitted when modal is minimized
- `onMinimizeRestore`: Emitted when minimized modal is restored
- `onSelected`: Emitted when modal is selected/focused
- `onMove`: Emitted when modal is moved

## Custom Styling

Import the styles in your project:

```css
@import "ng2-multi-modal/styles/theme/default.css";
@import "ng2-multi-modal/styles/style.css";

/* For dark theme */
@import "ng2-multi-modal/styles/theme/default-dark.css";
/*other theme we apply:*/
/*@import 'ng2-multi-modal/styles/theme/default.css'*/
/*@import 'ng2-multi-modal/styles/theme/macos.css'*/
/*@import 'ng2-multi-modal/styles/theme/material-design.css'*/
```

you can modify styles by overload css varibles:

```css
/*For example, you can change the window title bar text align*/
:root {
    --window-title-bar-text-align: left;
}

/*Or you can change the window title bar text align for dark theme*/
.ng-modal-theme-dark {
    --window-title-bar-text-align: center;
}
```

## Development

To run the demo application:

1. Clone the repository to your local machine.
2. Install dependencies using `npm install`.
3. Start the demo using `npm run start`.

To build the library, run:

```bash
ng build ng2-multi-modal
```

This command will compile your project, and the build artifacts will be placed in the `dist/` directory.

### Publishing the Library

Once the project is built, you can publish your library by following these steps:

1. Navigate to the `dist` directory:
   ```bash
   cd dist/ng2-multi-modal
   ```

2. Run the `npm publish` command to publish your library to the npm registry:
   ```bash
   npm publish
   ```

## Contribution

We welcome community contributions and pull requests. To contribute to `ng2-multi-modal`, please fork the repository and open a pull request.
