import { ApplicationRef, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Ng2MultiModalService } from './ng2-multi-modal.service';
import { NG2_MODAL_DATA } from './tokens';
import { provideNg2MultiModal } from './provider';

@Component({
  selector: 'spec-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span>{{ data.value }}</span>`,
})
class SpecContentComponent {
  readonly data = inject<{ value: number }>(NG2_MODAL_DATA);
}

describe('Ng2MultiModalService', () => {
  let service: Ng2MultiModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNg2MultiModal({ zIndexBase: 500, language: 'en' }),
      ],
    });
    service = TestBed.inject(Ng2MultiModalService);
  });

  afterEach(() => service.closeAll());

  it('opens a modal, registers it and selects it', () => {
    const ref = service.open('Hello', { title: 'Title' });
    expect(ref.id).toBeTruthy();
    expect(ref.componentInstance).toBeTruthy();
    expect(service.selectedWindow()).toBe(ref.id);
    expect(service.getRef(ref.id)).toBe(ref);
  });

  it('honors the configured zIndexBase and stacks successive windows', () => {
    const a = service.open('a');
    const b = service.open('b');
    expect(a.componentInstance.zIndex()).toBeGreaterThan(500);
    expect(b.componentInstance.zIndex()).toBeGreaterThan(a.componentInstance.zIndex());
  });

  it('bringToFront raises z-index and marks selected', () => {
    const a = service.open('a');
    service.open('b');
    const before = a.componentInstance.zIndex();
    service.bringToFront(a.id);
    expect(a.componentInstance.zIndex()).toBeGreaterThan(before);
    expect(service.selectedWindow()).toBe(a.id);
  });

  it('adds and removes windows from the dock', () => {
    const ref = service.open('x');
    service.addToDock(ref.componentInstance);
    expect(service.minimizedModals()).toContain(ref.componentInstance);
    service.removeFromDock(ref.componentInstance);
    expect(service.minimizedModals()).not.toContain(ref.componentInstance);
  });

  it('resolves afterClosed with the close result', (done) => {
    const ref = service.open<string>('x');
    ref.afterClosed().subscribe((result) => {
      expect(result).toBe('done');
      done();
    });
    ref.close('done');
  });

  it('creates a component as content with injected data', () => {
    const ref = service.open(SpecContentComponent, { data: { value: 42 } });
    TestBed.inject(ApplicationRef).tick();
    const contentRef = ref.contentRef as { instance: SpecContentComponent } | undefined;
    expect(contentRef).toBeTruthy();
    expect(contentRef!.instance.data.value).toBe(42);
  });

  it('closeAll closes every open modal', () => {
    service.open('a');
    service.open('b');
    service.closeAll();
    expect(service.selectedWindow()).toBeNull();
  });

  it('switches locale', () => {
    expect(service.locale().close).toBe('Close');
    service.setLocale('es');
    expect(service.locale().close).toBe('Cerrar');
  });
});
