import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  EnvironmentInjector,
  Injectable,
  Injector,
  InputSignal,
  ModelSignal,
  signal,
  TemplateRef,
  WritableSignal,
} from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Ng2MultiModalComponent } from "./ng2-multi-modal.component";
import { DockComponent } from "./components/dock/dock.component";

export interface ModalConfig {
  title?: InputSignal<string | TemplateRef<any>>;
  content: TemplateRef<any>;
  width?: ModelSignal<number>;
  height?: ModelSignal<number>;
  minWidth?: InputSignal<number>;
  minHeight?: InputSignal<number>;
  align?: InputSignal<"leftTop" | "rightTop" | "leftBottom" | "rightBottom">;
  offsetY?: ModelSignal<number>;
  offsetX?: ModelSignal<number>;
  zIndex?: ModelSignal<number>;
  titleStyle?: any;
  bodyStyle?: InputSignal<{
    [key: string]: any;
  }>;
  maximized?: ModelSignal<boolean>;
  icon?: InputSignal<string | TemplateRef<any> | null>;
  draggable?: ModelSignal<boolean>;
  resizable?: InputSignal<boolean>;
  closeOnNavigation?: InputSignal<boolean>;
  outOfBounds?: InputSignal<boolean>;
  closable?: InputSignal<boolean>;
  theme?: ModelSignal<"light" | "dark">;
}

@Injectable({ providedIn: 'root' })
export class Ng2MultiModalService {
  private unsubscribe$ = new Subject<void>();

  constructor(
    private _appRef: ApplicationRef,
    private _injector: Injector,
    private _environmentInjector: EnvironmentInjector,
    private router: Router
  ) {
    router.events.pipe(takeUntil(this.unsubscribe$)).subscribe((evt) => {
      if (evt instanceof NavigationStart) {
        this.instances.forEach(item => {
          if (item.instance.closeOnNavigation()) {
            item.instance.close();
          }
        });
      }
    });
  }

  dockTheme: 'light' | 'dark' = 'light';
  language: 'es' | 'en' = 'en';

  maxZIndex: number = 0;
  instances: ComponentRef<Ng2MultiModalComponent>[] = [];
  selectedWindow: WritableSignal<string | null> = signal(null);
  dockComponentRef: ComponentRef<DockComponent> | null = null;

  destroy(modalId: string) {
    const componentRef = this.instances.find(item => item.instance.modalId() === modalId);
    if (componentRef) {
      this.detachView(componentRef);
      componentRef.destroy();
      this.instances = this.instances.filter(item => item.instance.modalId() !== modalId);
      this.selectedWindow.set(null)
    }
    if (this.instances.length === 0) {
      this.destroyDock();
      this.destroyWrapper();
    }
  }

  addMinimizeItem(windowComponent: Ng2MultiModalComponent) {
    this.dockComponentRef!.instance.docks.push(windowComponent);
  }

  createDock() {
    if (!this.dockComponentRef) {
      this.dockComponentRef = createComponent(DockComponent, {
        environmentInjector: this._environmentInjector,
        elementInjector: this._injector
      });
      this._appRef.attachView(this.dockComponentRef.hostView);
      document.body.prepend(this.dockComponentRef.location.nativeElement);
    }
  }

  destroyDock() {
    if (this.dockComponentRef) {
      this._appRef.detachView(this.dockComponentRef.hostView);
      this.dockComponentRef.destroy();
      this.dockComponentRef = null;
    }
  }

  createWrapper() {
    if (!document.querySelector('#ng-modal-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.id = 'ng-modal-wrapper';
      document.body.prepend(wrapper);
    }
  }

  destroyWrapper() {
    const wrapper = document.querySelector('#ng-modal-wrapper');
    if (wrapper) {
      document.body.removeChild(wrapper);
    }
  }

  create(options: ModalConfig): Promise<Ng2MultiModalComponent> {
    this.createDock();
    this.createWrapper();
    return new Promise(resolve => {
      const componentRef: any = createComponent(Ng2MultiModalComponent, {
        environmentInjector: this._environmentInjector,
        elementInjector: this._injector
      });

      //if the options.left > window.innerWidth, then set left = window.innerWidth - options.width
      if (options.offsetX && options.width && options.offsetX() + options.width() > window.innerWidth) {
        options.offsetX.set(window.innerWidth - options.width() - 10);
      }
      //if the options.top > window.innerHeight, then set top = window.innerHeight - options.height
      if (options.offsetY && options.height && options.offsetY() + options.height() > window.innerHeight) {
        options.offsetY.set(window.innerHeight - options.height() - 30);
      }

      for (const i in options) {
        componentRef.instance[i] = (options as any)[i];
      }

      if (componentRef.instance.zIndex <= this.maxZIndex) {
        componentRef.instance.zIndex = this.maxZIndex = componentRef.instance.zIndex++;
      }
      this.selectedWindow.set(componentRef.instance.modalId());
      componentRef.changeDetectorRef.detectChanges();
      this._appRef.attachView(componentRef.hostView);
      this._appendToPage(componentRef.location.nativeElement, document.querySelector('#ng-modal-wrapper') as HTMLElement);
      this.instances = [
        ...this.instances,
        componentRef
      ]
      componentRef.instance.onClose.subscribe((modalId: string) => {
        this.dockComponentRef!.instance.docks = this.dockComponentRef!.instance.docks.filter(win => win !== componentRef.instance);
        this.destroy(modalId);
        if (this.selectedWindow() === modalId) {
          this.selectedWindow.set(null);
        }
      });
      resolve(componentRef.instance);
    });
  }

  detachView(componentRef: ComponentRef<any>) {
    this._appRef.detachView(componentRef.hostView);
  }

  private _appendToPage(innerElement: HTMLElement, outerElement?: HTMLElement) {
    if (outerElement) {
      outerElement.appendChild(innerElement);
      return;
    }
    document.body.appendChild(innerElement);
  }
}
