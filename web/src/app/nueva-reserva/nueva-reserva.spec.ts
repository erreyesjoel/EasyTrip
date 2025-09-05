import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevaReserva } from './nueva-reserva';

describe('NuevaReserva', () => {
  let component: NuevaReserva;
  let fixture: ComponentFixture<NuevaReserva>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevaReserva]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuevaReserva);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
