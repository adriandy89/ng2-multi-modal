import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ng2MultiModalComponent } from './ng2-multi-modal.component';

describe('Ng2MultiModalComponent', () => {
  let component: Ng2MultiModalComponent;
  let fixture: ComponentFixture<Ng2MultiModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ng2MultiModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Ng2MultiModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
