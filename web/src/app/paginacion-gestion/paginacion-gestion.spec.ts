import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginacionGestion } from './paginacion-gestion';

describe('PaginacionGestion', () => {
  let component: PaginacionGestion;
  let fixture: ComponentFixture<PaginacionGestion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginacionGestion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaginacionGestion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
