import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionPaquetes } from './gestion-paquetes';

describe('GestionPaquetes', () => {
  let component: GestionPaquetes;
  let fixture: ComponentFixture<GestionPaquetes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionPaquetes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionPaquetes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
