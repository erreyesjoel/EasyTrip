import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Paquetes } from './paquetes';

describe('Paquetes', () => {
  let component: Paquetes;
  let fixture: ComponentFixture<Paquetes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Paquetes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Paquetes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
