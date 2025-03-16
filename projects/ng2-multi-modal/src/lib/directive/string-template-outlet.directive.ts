import {
  Directive,
  EmbeddedViewRef,
  TemplateRef,
  ViewContainerRef,
  input,
  effect,
  untracked
} from '@angular/core';

@Directive({
  selector: '[stringTemplateOutlet]',
  exportAs: 'stringTemplateOutlet',
  standalone: true
})
export class StringTemplateOutletDirective<_T = unknown> {
  private embeddedViewRef: EmbeddedViewRef<any> | null = null;
  private context = new StringTemplateOutletContext();

  // Using Angular 19's input() function instead of @Input decorator
  readonly stringTemplateOutletContext = input<any | null>(null);
  readonly stringTemplateOutlet = input<any | TemplateRef<any>>(null);

  static ngTemplateContextGuard<T>(
    _dir: StringTemplateOutletDirective<T>,
    _ctx: any
  ): _ctx is StringTemplateOutletContext {
    return true;
  }

  constructor(private viewContainer: ViewContainerRef, private templateRef: TemplateRef<any>) {
    // Effect that reacts to changes in inputs
    effect(() => {
      // Read the current values of inputs
      const outlet = this.stringTemplateOutlet();
      const _ = this.stringTemplateOutletContext();

      // Update the implicit context when outlet changes
      if (outlet !== null) {
        this.context.$implicit = outlet;
      }

      // Determine if we should recreate the view
      untracked(() => {
        const isNewOutletTemplate = outlet instanceof TemplateRef;

        // Check if the embedded view exists and if the template type changed
        const shouldRecreate =
          !this.embeddedViewRef ||
          (this.embeddedViewRef && isNewOutletTemplate);

        if (shouldRecreate) {
          this.recreateView();
        } else if (this.embeddedViewRef) {
          this.updateContext();
        }
      });
    });
  }

  private recreateView(): void {
    this.viewContainer.clear();
    const isTemplateRef = this.stringTemplateOutlet() instanceof TemplateRef;
    const templateRef = (isTemplateRef ? this.stringTemplateOutlet() : this.templateRef) as any;
    this.embeddedViewRef = this.viewContainer.createEmbeddedView(
      templateRef,
      isTemplateRef ? this.stringTemplateOutletContext() : this.context
    );
  }

  private updateContext(): void {
    if (!this.embeddedViewRef) return;

    const isTemplateRef = this.stringTemplateOutlet() instanceof TemplateRef;
    const newCtx = isTemplateRef ? this.stringTemplateOutletContext() : this.context;
    const oldCtx = this.embeddedViewRef.context as any;

    if (newCtx) {
      for (const propName of Object.keys(newCtx)) {
        oldCtx[propName] = newCtx[propName];
      }
    }
  }
}

export class StringTemplateOutletContext {
  public $implicit: any;
}
