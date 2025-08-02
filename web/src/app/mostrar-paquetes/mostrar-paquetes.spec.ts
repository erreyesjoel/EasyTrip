import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MostrarPaquetes } from './mostrar-paquetes';

describe('MostrarPaquetes', () => {
  let component: MostrarPaquetes;
  let fixture: ComponentFixture<MostrarPaquetes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MostrarPaquetes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MostrarPaquetes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
