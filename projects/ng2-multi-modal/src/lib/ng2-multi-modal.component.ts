import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  HostListener,
  input,
  model,
  OnDestroy,
  output,
  signal,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { Ng2MultiModalService } from "./ng2-multi-modal.service";
import { CommonModule } from "@angular/common";
import { LoadingIcon } from "./components/icon/loading.icon";
import { CloseIcon } from './components/icon/close.icon';
import { MaximizeIcon } from "./components/icon/maximize.icon";
import { MinimizeIcon } from './components/icon/minimize.icon';
import { MaximizeDIcon } from "./components/icon/maximized.icon";
import { StringTemplateOutletDirective } from "./directive/string-template-outlet.directive";

interface ModalSize {
  offsetY: number;
  offsetX: number;
  align: 'leftTop' | 'rightTop' | 'leftBottom' | 'rightBottom';
  width: number;
  height: number;
}

@Component({
  selector: 'ng2-multi-modal',
  templateUrl: 'ng2-multi-modal.component.html',
  imports: [CommonModule, CloseIcon, LoadingIcon, MaximizeIcon, MinimizeIcon, MaximizeDIcon, StringTemplateOutletDirective],
  standalone: true,
})
export class Ng2MultiModalComponent implements AfterViewInit, OnDestroy {
  readonly modalId = signal('window' + Math.floor(Math.random() * 1000000));
  readonly titleHeight = signal(0);
  readonly position = signal<{ [key: string]: string }>({});
  readonly dragging = signal(false);
  readonly windowMouseEnterFlag = signal(false);
  readonly windowMouseDownFlag = signal(false);
  readonly windowMouseLeaveFlag = signal(true);
  readonly clickedX = signal(0);
  readonly clickedY = signal(0);
  readonly mouseEventSignal = signal<MouseEvent | null>(null);
  readonly mouseEnteredSignal = signal<MouseEvent | null>(null);
  readonly borderWidth = signal(4);
  readonly cursorStyle = signal('default');
  readonly display = signal('none');
  readonly border = signal<{
    isLeft?: boolean;
    isRight?: boolean;
    isTop?: boolean;
    isBottom?: boolean;
  }>({
    isLeft: false,
    isRight: false,
    isTop: false,
    isBottom: false
  });
  readonly propertyBeforeMaximize = signal<ModalSize | null>(null);
  // Input signals
  readonly title = input<string | TemplateRef<any>>('Modal Name');
  readonly icon = input<string | TemplateRef<any> | null>(null);
  readonly align = input<'leftTop' | 'rightTop' | 'leftBottom' | 'rightBottom'>('leftTop');
  readonly bodyStyle = input<{ [key: string]: any }>({});
  readonly closeOnNavigation = input(false);
  readonly closable = input(true);
  readonly content = input<TemplateRef<any>>();
  readonly minHeight = input(100);
  readonly minWidth = input(175);
  readonly maximizable = input(true);
  readonly minimizable = input(true);
  readonly resizable = input(true);
  readonly outOfBounds = input(false);
  readonly loadingTip = input<string | TemplateRef<any>>(this.getLocaleText('loading'));
  // Model signals
  readonly height = model(300);
  readonly width = model(300);
  readonly zIndex = model(0);
  readonly offsetY = model(200);
  readonly offsetX = model(200);
  readonly loading = model(true);
  readonly theme = model<'light' | 'dark'>('light');
  readonly draggable = model(true);
  readonly contentScrollable = model(false);
  readonly minimized = model(false);
  readonly maximized = model(false);
  // Output events
  readonly onReady = output<Ng2MultiModalComponent>();
  readonly onClose = output<string>();
  readonly onResize = output<ModalSize>();
  readonly onMaximize = output<ModalSize>();
  readonly onMaximizeRestore = output<ModalSize>();
  readonly onMinimize = output<ModalSize>();
  readonly onMinimizeRestore = output<ModalSize>();
  readonly onSelected = output<string>();
  readonly onMove = output<ModalSize>();

  constructor(private modalService: Ng2MultiModalService) { }

  get language() {
    return this.modalService?.language() || 'en';
  }

  readonly windowSizeSignal = computed(() => ({
    offsetX: this.offsetX(),
    offsetY: this.offsetY(),
    align: this.align(),
    width: this.width(),
    height: this.height()
  }));

  readonly leftSignal = computed(() =>
    (this.align() === 'leftTop' || this.align() === 'leftBottom') ?
      this.offsetX() : window.innerWidth - this.width() - this.offsetX()
  );

  readonly rightSignal = computed(() =>
    (this.align() === 'rightTop' || this.align() === 'rightBottom') ?
      window.innerWidth - this.offsetX() : this.width() + this.offsetX()
  );

  readonly topSignal = computed(() =>
    (this.align() === 'leftTop' || this.align() === 'rightTop') ?
      this.offsetY() : window.innerHeight - this.height() - this.offsetY()
  );

  readonly bottomSignal = computed(() =>
    (this.align() === 'leftBottom' || this.align() === 'rightBottom') ?
      window.innerHeight - this.offsetY() : this.height() + this.offsetY()
  );

  readonly selectedSignal = computed(() => this.modalService.selectedWindow() === this.modalId());

  // Create a signal for the element
  readonly titleBarElement = signal<ElementRef | null>(null);

  // Update the setter
  @ViewChild('titleBar', { static: false }) set titleBar(titleBar: ElementRef) {
    this.titleBarElement.set(titleBar);
    if (titleBar) {
      this.titleHeight.set(titleBar.nativeElement.offsetHeight);
    }
  }

  getLocaleText(text: 'loading' | 'close' | 'maximize' | 'minimize' | 'windowMode') {
    const dictionary = {
      'es': {
        loading: 'Loading...',
        close: 'Close Window',
        maximize: 'Maximize',
        minimize: 'Minimize',
        windowMode: 'Window Mode',
      },
      'en': {
        loading: 'Loading...',
        close: 'Close Window',
        maximize: 'Maximize',
        minimize: 'Minimize',
        windowMode: 'Window Mode',
      }
    }
    return dictionary[this.language][text];
  }

  updateOffsetX(offsetX: number) {
    this.offsetX.set(offsetX);
    if (['leftTop', 'leftBottom'].includes(this.align())) {
      this.position.update((oldValue: any) => {
        return {
          ...oldValue,
          left: offsetX + 'px',
          right: null
        }
      })
    } else {
      this.position.update((oldValue: any) => {
        return {
          ...oldValue,
          left: null,
          right: offsetX + 'px'
        }
      })
    }
  }

  updateOffsetY(offsetY: number) {
    this.offsetY.set(offsetY);
    if (['leftTop', 'rightTop'].includes(this.align())) {
      this.position.update((oldValue: any) => {
        return {
          ...oldValue,
          top: offsetY + 'px',
          bottom: null
        }
      })
    } else {
      this.position.update((oldValue: any) => {
        return {
          ...oldValue,
          top: null,
          bottom: offsetY + 'px'
        }
      })
    }
  }

  private preventTextSelection(prevent: boolean): void {
    if (prevent) {
      // Create a temporary overlay div that covers the entire viewport
      // This catches all mouse events during resize/drag without affecting actual content
      if (!document.getElementById('ng2-modal-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'ng2-modal-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.zIndex = '999999';
        overlay.style.pointerEvents = 'none'; // Allow events to pass through
        document.body.appendChild(overlay);
      }

      // Better to use a class to avoid direct style manipulation
      document.body.classList.add('ng2-modal-no-select');

      // Add style if it doesn't exist
      if (!document.getElementById('ng2-modal-style')) {
        const style = document.createElement('style');
        style.id = 'ng2-modal-style';
        style.innerHTML = `
          .ng2-modal-no-select {
            cursor: inherit !important;
          }
          .ng2-modal-no-select ::selection {
            background: transparent !important;
          }
          .ng2-modal-no-select ::-moz-selection {
            background: transparent !important;
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      // Remove all elements we added
      document.body.classList.remove('ng2-modal-no-select');
      const overlay = document.getElementById('ng2-modal-overlay');
      if (overlay) {
        overlay.remove();
      }
    }
  }

  @HostListener('document:mouseleave')
  documentMouseLeave() {
    // Ensure text selection is re-enabled when the mouse leaves the document
    this.preventTextSelection(false);
    this.dragging.set(false);
    this.windowMouseDownFlag.set(false);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.draggable() || this.maximized()) {
      return;
    }
    this.mouseEventSignal.set(event);
    // Only prevent text selection during actual dragging or resizing
    if (this.dragging() || (this.windowMouseDownFlag() && this.resizable() &&
      Object.values(this.border()).some(value => value === true))) {
      this.preventTextSelection(true);
    }
    if (this.dragging()) {
      // Replace when(this.align) with switch or if/else
      let newOffsetX = 0;
      if (this.align() === 'leftTop' || this.align() === 'leftBottom') {
        if (!this.outOfBounds) {
          let offsetX = Math.max(event.clientX - this.clickedX(), 0);
          if (offsetX + this.width() > window.innerWidth) {
            offsetX = window.innerWidth - this.width();
          }
          newOffsetX = offsetX;
        } else {
          newOffsetX = event.clientX - this.clickedX();
        }
      } else if (this.align() === 'rightTop' || this.align() === 'rightBottom') {
        if (!this.outOfBounds) {
          let offsetX = Math.max(window.innerWidth - event.clientX + this.clickedX() - this.width(), 0);
          if (offsetX + this.width() > window.innerWidth) {
            offsetX = window.innerWidth - this.width();
          }
          newOffsetX = offsetX;
        } else {
          newOffsetX = window.innerWidth - event.clientX + this.clickedX() - this.width();
        }
      }
      this.updateOffsetX(newOffsetX);

      // Handle Y positioning
      let newOffsetY = 0;
      if (this.align() === 'leftTop' || this.align() === 'rightTop') {
        if (!this.outOfBounds) {
          let offsetY = Math.max(event.clientY - this.clickedY(), 0);
          if (offsetY + this.height() > window.innerHeight) {
            offsetY = window.innerHeight - this.height();
          }
          newOffsetY = offsetY;
        } else {
          newOffsetY = event.clientY - this.clickedY();
        }
      } else if (this.align() === 'leftBottom' || this.align() === 'rightBottom') {
        if (!this.outOfBounds) {
          let offsetY = Math.max(window.innerHeight - event.clientY + this.clickedY() - this.height(), 0);
          if (offsetY + this.height() > window.innerHeight) {
            offsetY = window.innerHeight - this.height();
          }
          newOffsetY = offsetY;
        } else {
          newOffsetY = window.innerHeight - event.clientY + this.clickedY() - this.height();
        }
      }
      this.updateOffsetY(newOffsetY);
    }

    if (this.windowMouseDownFlag() && this.resizable()) {
      this.resizeWindow(event);
    } else {
      this.onMove.emit({ ...this as any });
    }

    let x = event.clientX;
    let y = event.clientY;

    let leftBorderX = Math.abs(this.leftSignal() - x) <= this.borderWidth();
    let rightBorderX = Math.abs(this.leftSignal() + this.width() - x) <= this.borderWidth();
    let rightLeftBorderY = (y > this.topSignal()) && (y < (this.topSignal() + this.height()));


    let topBorderY = Math.abs(this.topSignal() - y) <= this.borderWidth();
    let bottomBorderY = Math.abs(this.topSignal() + this.height() - y) <= this.borderWidth();
    let topBottomBorderX = x > this.leftSignal() && x < this.leftSignal() + this.width();

    if (this.resizable()) {
      if (leftBorderX && bottomBorderY) {
        this.cursorStyle.set('sw-resize');
        this.border.set({
          isLeft: true,
          isBottom: true,
        })
        this.contentScrollable.set(true);
      } else if (rightBorderX && bottomBorderY) {
        this.cursorStyle.set('se-resize');
        this.border.set({
          isRight: true,
          isBottom: true,
        });
        this.contentScrollable.set(true);
      } else if (leftBorderX && topBorderY) {
        this.cursorStyle.set('nw-resize');
        this.border.set({
          isLeft: true,
          isTop: true,
        });
        this.contentScrollable.set(true);
      } else if (rightBorderX && topBorderY) {
        this.cursorStyle.set('ne-resize');
        this.border.set({
          isRight: true,
          isTop: true,
        });
        this.contentScrollable.set(true);
      } else if (leftBorderX && rightLeftBorderY) {
        this.cursorStyle.set('w-resize');
        this.border.set({
          isLeft: true,
        });
        this.contentScrollable.set(true);
      } else if (rightBorderX && rightLeftBorderY) {
        this.cursorStyle.set('e-resize');
        this.border.set({
          isRight: true,
        });
        this.contentScrollable.set(true);
      } else if (topBorderY && topBottomBorderX) {
        this.cursorStyle.set('n-resize');
        this.border.set({
          isTop: true,
        });
        this.contentScrollable.set(true);
      } else if (bottomBorderY && topBottomBorderX) {
        this.cursorStyle.set('s-resize');
        this.border.set({
          isBottom: true,
        });
        this.contentScrollable.set(true);
      } else {
        this.border.set({});
        this.cursorStyle.set('auto');
        this.contentScrollable.set(false);
      }
    }
  }

  resizeWindow(event: MouseEvent) {
    if (!this.draggable()) {
      return;
    }
    if (this.dragging()) {
      return;
    }
    if (!this.border().isLeft && !this.border().isRight && !this.border().isTop && !this.border().isBottom) {
      return;
    }
    if (this.border().isLeft) {
      if (this.align().toLocaleLowerCase().includes('left')) {
        let r = this.rightSignal();
        this.updateOffsetX(event.clientX);
        this.width.set(r - this.leftSignal());
      } else {
        this.width.set(this.rightSignal() - event.clientX);
      }
    }
    if (this.border().isRight) {
      if (this.align().toLocaleLowerCase().includes('left')) {
        this.width.update(prev => prev + event.clientX - this.rightSignal());
      } else {
        this.width.update(prev => prev + event.clientX - this.rightSignal());;
        this.updateOffsetX(Math.max(window.innerWidth - event.clientX, 0));
      }
    }
    if (this.border().isTop) {
      if (this.align().toLocaleLowerCase().includes('top')) {
        let b = this.bottomSignal();
        this.updateOffsetY(Math.max(event.clientY, 0));
        this.height.set(b - this.topSignal());
      } else {
        this.height.set(this.bottomSignal() - event.clientY);
      }
    }
    if (this.border().isBottom) {
      if (this.align().toLocaleLowerCase().includes('top')) {
        this.height.update(prev => prev + event.clientY - this.bottomSignal());
      } else {
        this.height.update(prev => prev + event.clientY - this.bottomSignal());
        this.updateOffsetY(Math.max(window.innerHeight - event.clientY, 0));
      }
    }

    if (this.height() < this.minHeight()) {
      this.height.set(this.minHeight());
    }
    if (this.width() < this.minWidth()) {
      this.width.set(this.minWidth());
    }
    if (!this.outOfBounds() && this.height() + this.offsetY() > window.innerHeight) {
      this.updateOffsetY(Math.max(window.innerHeight - this.height(), 0));
    }
    if (!this.outOfBounds && this.width() + this.offsetX() > window.innerWidth) {
      this.updateOffsetX(Math.max(window.innerWidth - this.width(), 0));
    }
    if (this.offsetY() < 0) {
      this.updateOffsetY(0);
    }
    this.onResize.emit(this.windowSizeSignal());
  }

  titleBarMouseDown(event: MouseEvent) {
    if (event.button === 2) {
      return;
    }
    // Prevent default action to avoid text selection
    event.preventDefault();

    // Enable text selection prevention
    this.preventTextSelection(true);

    this.dragging.set(true);
    this.clickedX.set(event.clientX - this.leftSignal());
    this.clickedY.set(event.clientY - this.topSignal());
  }

  @HostListener('document:mouseup', ['$event'])
  titleBarMouseUp(event: MouseEvent) {
    // We should always re-enable text selection on mouse up
    this.preventTextSelection(false);
    this.dragging.set(false);
    this.windowMouseDownFlag.set(false);
  }

  // Add a key event listener to ensure we clean up if Escape is pressed
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    this.preventTextSelection(false);
  }

  windowMouseEnter(event: MouseEvent) {
    if (!this.draggable()) {
      return;
    }
    this.mouseEnteredSignal.set(event);
    this.windowMouseEnterFlag.set(true);
    this.windowMouseLeaveFlag.set(false);
  }

  windowMouseDown(event: MouseEvent) {
    this.modalService.selectedWindow.set(this.modalId());
    if (!this.draggable() || event.button === 2) {
      return;
    }

    // Only prevent selection when clicking on a border for resizing
    const onBorder = Object.values(this.border()).some(value => value === true);
    if (onBorder && this.resizable()) {
      event.preventDefault();
      this.preventTextSelection(true);
    }

    this.windowMouseDownFlag.set(true);
    this.onSelected.emit(this.modalId());
    if (this.windowMouseDownFlag() && this.windowMouseEnterFlag()) {
      const idx = this.modalService.maxZIndex++;
      this.zIndex.set(idx);
    }
  }

  windowMouseLeave(event: MouseEvent) {
    if (!this.draggable()) {
      return;
    }
    this.windowMouseLeaveFlag.set(true);
    this.windowMouseEnterFlag.set(false);
  }

  close() {
    if (this.closable()) {
      this.height.set(0);
      window.onresize = null;
      this.toggleBodyScrollable(true);
      this.display.set('none');
      this.onClose.emit(this.modalId());
    }
  }

  minimize() {
    window.onresize = null;
    if (this.minimized()) {
      this.minimized.set(false);
      this.display.set('block');
      // this.modalService.dockComponentRef!.instance.docks =
      // this.modalService.dockComponentRef!.instance.docks.filter(win => win != this);
      this.modalService.dockComponentRef!.instance.docks.update(prev => prev.filter(win => win !== this));
      this.onMinimizeRestore.emit(this.windowSizeSignal());
    } else {
      this.toggleBodyScrollable(true);

      this.minimized.set(true);
      setTimeout(() => {
        this.display.set('none');
      }, 200);
      this.modalService.addMinimizeItem(this);
      this.onMinimize.emit(this.windowSizeSignal());
    }
    this.onResize.emit(this.windowSizeSignal());
  }

  maximize(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      const isCurrentlyMaximized = this.maximized();
      const hasStoredProperties = !!this.propertyBeforeMaximize();

      if (isCurrentlyMaximized && hasStoredProperties) {
        // Restore from maximized state
        this.toggleBodyScrollable(true);
        window.onresize = null;
        this.maximized.set(false);

        const { width, height, offsetX, offsetY } = this.propertyBeforeMaximize()!;
        this.width.set(width);
        this.height.set(height);
        this.updateOffsetX(offsetX);
        this.updateOffsetY(offsetY);
        this.draggable.set(true);

        this.onResize.emit(this.windowSizeSignal());
        this.onMaximizeRestore.emit(this.windowSizeSignal());
        resolve(true);
      } else {
        // Save current state before maximizing
        this.propertyBeforeMaximize.set({
          width: this.width(),
          height: this.height(),
          offsetX: this.offsetX(),
          offsetY: this.offsetY(),
          align: this.align()
        });

        // Maximize the window
        this.toggleBodyScrollable(false);
        this.maximized.set(true);
        this.draggable.set(false);

        // Set dimensions and position
        this.updateOffsetX(0);
        this.updateOffsetY(0);
        this.height.set(window.innerHeight);
        this.width.set(window.innerWidth);

        // Handle window resize when maximized
        window.onresize = () => {
          this.width.set(window.innerWidth);
          this.height.set(window.innerHeight);
          this.updateOffsetX(0);
          this.updateOffsetY(0);
        };

        this.onResize.emit(this.windowSizeSignal());
        this.onMaximize.emit(this.windowSizeSignal());
        resolve(true);
      }
    });
  }
  //if html window resized, judge if window is out of screen, if so, move it to the screen
  @HostListener('window: resize', ['$event'])
  resizeListener(event: Event) {
    if (this.offsetY() + this.height() > window.innerHeight) {
      this.updateOffsetY(Math.max(window.innerHeight - this.height(), 0));
    }
    if (this.offsetX() + this.width() > window.innerWidth) {
      this.updateOffsetX(Math.max(window.innerWidth - this.width(), 0));
    }
    this.onResize.emit(this.windowSizeSignal());
  }

  toggleBodyScrollable(scrollable = true) {
    setTimeout(() => {
      if (scrollable) {
        document.body.style.overflow = 'auto';
      } else {
        document.body.style.overflow = 'hidden';
      }
    }, 200);
  }

  ngOnDestroy(): void {
    // Clean up any remaining text selection prevention
    this.preventTextSelection(false);

    // Remove any window resize handlers
    window.onresize = null;
  }

  async ngAfterViewInit(): Promise<void> {
    if (this.maximized()) {
      this.display.set('none');
      this.maximized.set(false);
      await this.maximize();
    }
    this.display.set('block');
    this.loading.set(false)
    this.onReady.emit(this);
    this.updateOffsetX(this.offsetX());
    this.updateOffsetY(this.offsetY());
  }
}
