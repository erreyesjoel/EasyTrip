import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefinirPassword } from './definir-password';

describe('DefinirPassword', () => {
  let component: DefinirPassword;
  let fixture: ComponentFixture<DefinirPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefinirPassword]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DefinirPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
