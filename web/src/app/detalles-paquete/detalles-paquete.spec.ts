import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallesPaquete } from './detalles-paquete';

describe('DetallesPaquete', () => {
  let component: DetallesPaquete;
  let fixture: ComponentFixture<DetallesPaquete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallesPaquete]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetallesPaquete);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
