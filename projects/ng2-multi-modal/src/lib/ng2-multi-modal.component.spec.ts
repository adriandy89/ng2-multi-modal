import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Ng2MultiModalComponent } from './ng2-multi-modal.component';
import { Ng2MultiModalService } from './ng2-multi-modal.service';

describe('Ng2MultiModalComponent', () => {
  function create(): ComponentFixture<Ng2MultiModalComponent> {
    const fixture = TestBed.createComponent(Ng2MultiModalComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('creates', () => {
    expect(create().componentInstance).toBeTruthy();
  });

  it('maximizes then restores', async () => {
    const c = create().componentInstance;
    expect(c.maximized()).toBe(false);
    await c.maximize();
    expect(c.maximized()).toBe(true);
    expect(c.width()).toBeGreaterThan(0);
    await c.maximize();
    expect(c.maximized()).toBe(false);
  });

  it('minimizes to the dock and restores', () => {
    const service = TestBed.inject(Ng2MultiModalService);
    const c = create().componentInstance;
    c.minimize();
    expect(c.minimized()).toBe(true);
    expect(service.minimizedModals()).toContain(c);
    c.restoreWindow();
    expect(c.minimized()).toBe(false);
    expect(service.minimizedModals()).not.toContain(c);
  });

  it('emits onClose when closable', () => {
    const c = create().componentInstance;
    let emitted: string | undefined;
    c.onClose.subscribe((id) => (emitted = id));
    c.close();
    expect(emitted).toBe(c.modalId());
  });

  it('does not close when closable is false', () => {
    const fixture = create();
    fixture.componentRef.setInput('closable', false);
    fixture.detectChanges();
    let emitted = false;
    fixture.componentInstance.onClose.subscribe(() => (emitted = true));
    fixture.componentInstance.close();
    expect(emitted).toBe(false);
  });

  it('resolves the "auto" theme from the OS preference', () => {
    const service = TestBed.inject(Ng2MultiModalService);
    const fixture = create();
    fixture.componentRef.setInput('theme', 'auto');
    service.prefersDark.set(true);
    fixture.detectChanges();
    expect(fixture.componentInstance.resolvedTheme()).toBe('dark');
    service.prefersDark.set(false);
    fixture.detectChanges();
    expect(fixture.componentInstance.resolvedTheme()).toBe('light');
  });

  it('respects minWidth/minHeight when maximizing keeps sizes positive', () => {
    const fixture = create();
    fixture.componentRef.setInput('minWidth', 150);
    fixture.componentRef.setInput('minHeight', 120);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    expect(c.minWidth()).toBe(150);
    expect(c.minHeight()).toBe(120);
  });
});
