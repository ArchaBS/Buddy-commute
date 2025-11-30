import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RidetrackingComponent } from './ridetracking.component';

describe('RidetrackingComponent', () => {
  let component: RidetrackingComponent;
  let fixture: ComponentFixture<RidetrackingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RidetrackingComponent]
    });
    fixture = TestBed.createComponent(RidetrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
