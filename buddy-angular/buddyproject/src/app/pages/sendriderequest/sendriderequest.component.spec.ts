import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendriderequestComponent } from './sendriderequest.component';

describe('SendriderequestComponent', () => {
  let component: SendriderequestComponent;
  let fixture: ComponentFixture<SendriderequestComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SendriderequestComponent]
    });
    fixture = TestBed.createComponent(SendriderequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
