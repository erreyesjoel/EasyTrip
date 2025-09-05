import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservasUsuario } from './reservas-usuario';

describe('ReservasUsuario', () => {
  let component: ReservasUsuario;
  let fixture: ComponentFixture<ReservasUsuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservasUsuario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservasUsuario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
