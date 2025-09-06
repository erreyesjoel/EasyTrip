import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginacionCliente } from './paginacion-cliente';

describe('PaginacionCliente', () => {
  let component: PaginacionCliente;
  let fixture: ComponentFixture<PaginacionCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginacionCliente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaginacionCliente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
