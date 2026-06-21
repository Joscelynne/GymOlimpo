/// <reference types="jasmine" />

import { GymService } from './gym.service';

describe('GymService', () => {

  let service: GymService;

  beforeEach(() => {
    service = new GymService({} as any, {} as any);
  });

  /*
   * Verifica que el servicio se instancia correctamente.
   */
  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  /*
   * Verifica que existan planes disponibles.
   */
  it('debe retornar planes disponibles', () => {
    const planes = service.getPlanesDisponibles();

    expect(planes.length).toBeGreaterThan(0);
  });

  /*
   * Verifica que todos los planes tengan nombre.
   */
  it('cada plan debe tener nombre', () => {
    const planes = service.getPlanesDisponibles();

    planes.forEach(plan => {
      expect(plan.nombre).toBeTruthy();
    });
  });

  /*
   * Verifica que todos los planes tengan precio válido.
   */
  it('cada plan debe tener precio', () => {
    const planes = service.getPlanesDisponibles();

    planes.forEach(plan => {
      expect(plan.precio).toBeGreaterThan(0);
    });
  });

  /*
   * Verifica que todos los planes tengan sesiones.
   */
  it('cada plan debe tener sesiones', () => {
    const planes = service.getPlanesDisponibles();

    planes.forEach(plan => {
      expect(plan.sesiones).toBeGreaterThan(0);
    });
  });

  /*
   * Verifica que ningún plan tenga ID vacío.
   */
  it('cada plan debe tener id', () => {
    const planes = service.getPlanesDisponibles();

    planes.forEach(plan => {
      expect(plan.id).toBeTruthy();
    });
  });

  /*
   * Verifica que exista al menos un plan recomendado.
   */
  it('debe existir un plan recomendado', () => {
    const planes = service.getPlanesDisponibles();

    const recomendados = planes.filter(
      p => p.recomendado
    );

    expect(recomendados.length).toBeGreaterThan(0);
  });

  /*
   * Verifica que existan planes de tipo clase.
   */
  it('debe existir al menos un plan de clase', () => {
    const planes = service.getPlanesDisponibles();

    const clases = planes.filter(
      p => p.tipo === 'clase'
    );

    expect(clases.length).toBeGreaterThan(0);
  });

  /*
   * Verifica que existan planes de asesoría.
   */
  it('debe existir al menos un plan de asesoria', () => {
    const planes = service.getPlanesDisponibles();

    const asesorias = planes.filter(
      p => p.tipo === 'asesoria'
    );

    expect(asesorias.length).toBeGreaterThan(0);
  });

  /*
   * Verifica que todos los planes tengan descripción.
   */
  it('todos los planes deben tener descripcion', () => {
    const planes = service.getPlanesDisponibles();

    planes.forEach(plan => {
      expect(plan.descripcion.length).toBeGreaterThan(0);
    });
  });

  /*
   * Todos los planes deben tener precio mayor a cero.
   */
  it('todos los planes deben tener precio mayor a cero', () => {
    const planes = service.getPlanesDisponibles();

    planes.forEach(plan => {
      expect(plan.precio).toBeGreaterThan(0);
    });
  });

  /*
   * Todos los planes deben tener nombre válido.
   */
  it('todos los planes deben tener nombre valido', () => {
    const planes = service.getPlanesDisponibles();

    planes.forEach(plan => {
      expect(plan.nombre.trim().length).toBeGreaterThan(0);
    });
  });

  /*
   * Todos los planes deben tener descripción válida.
   */
  it('todos los planes deben tener descripcion valida', () => {
    const planes = service.getPlanesDisponibles();

    planes.forEach(plan => {
      expect(plan.descripcion.length).toBeGreaterThan(0);
    });
  });

  /*
   * Todos los planes deben tener sesiones positivas.
   */
  it('todos los planes deben tener sesiones positivas', () => {
    const planes = service.getPlanesDisponibles();

    planes.forEach(plan => {
      expect(plan.sesiones).toBeGreaterThan(0);
    });
  });

  /*
   * Todos los planes deben tener identificador válido.
   */
  it('todos los planes deben tener identificador valido', () => {
    const planes = service.getPlanesDisponibles();

    planes.forEach(plan => {
      expect(plan.id.trim().length).toBeGreaterThan(0);
    });
  });

  /*
   * Debe existir el plan Empieza a moverte.
   */
  it('debe existir plan empieza a moverte', () => {
    const planes = service.getPlanesDisponibles();

    const plan = planes.find(
      p => p.id === 'empieza-a-moverte'
    );

    expect(plan).toBeTruthy();
  });

  /*
   * Debe existir al menos un plan recomendado.
   */
  it('debe existir al menos un recomendado', () => {
    const planes = service.getPlanesDisponibles();

    const recomendados = planes.filter(
      p => p.recomendado === true
    );

    expect(recomendados.length).toBeGreaterThan(0);
  });

  /*
   * No debe haber IDs repetidos.
   */
  it('no debe haber ids repetidos', () => {
    const planes = service.getPlanesDisponibles();

    const ids = planes.map(
      p => p.id
    );

    const unicos = [...new Set(ids)];

    expect(ids.length).toEqual(unicos.length);
  });

  /*
   * Debe existir una asesoría.
   */
  it('debe existir una asesoria', () => {
    const planes = service.getPlanesDisponibles();

    const asesoria = planes.find(
      p => p.tipo === 'asesoria'
    );

    expect(asesoria).toBeTruthy();
  });

  /*
   * Debe existir una clase.
   */
  it('debe existir una clase', () => {
    const planes = service.getPlanesDisponibles();

    const clase = planes.find(
      p => p.tipo === 'clase'
    );

    expect(clase).toBeTruthy();
  });

    /*
    * Ningún plan puede tener precio negativo.
    */
    it('ningun plan debe tener precio negativo', () => {
    const planes = service.getPlanesDisponibles();

    planes.forEach(plan => {
        expect(plan.precio).toBeGreaterThanOrEqual(0);
    });
    });

    /*
    * Ningún plan puede tener sesiones negativas.
    */
    it('ningun plan debe tener sesiones negativas', () => {
    const planes = service.getPlanesDisponibles();

    planes.forEach(plan => {
        expect(plan.sesiones).toBeGreaterThanOrEqual(0);
    });
    });

    /*
    * Todos los ids deben ser string.
    */
    it('todos los ids deben ser string', () => {
    const planes = service.getPlanesDisponibles();

    planes.forEach(plan => {
        expect(typeof plan.id).toBe('string');
    });
    });

    /*
    * Todos los nombres deben ser string.
    */
    it('todos los nombres deben ser string', () => {
    const planes = service.getPlanesDisponibles();

    planes.forEach(plan => {
        expect(typeof plan.nombre).toBe('string');
    });
    });

    /*
    * Todos los precios deben ser number.
    */
    it('todos los precios deben ser number', () => {
    const planes = service.getPlanesDisponibles();

    planes.forEach(plan => {
        expect(typeof plan.precio).toBe('number');
    });
    });

    /*
    * Todos los planes deben tener más de una sesión.
    */
    it('todos los planes deben tener al menos una sesion', () => {
    const planes = service.getPlanesDisponibles();

    planes.forEach(plan => {
        expect(plan.sesiones).toBeGreaterThan(0);
    });
    });

    /*
    * Debe existir más de un plan.
    */
    it('debe existir mas de un plan', () => {
    const planes = service.getPlanesDisponibles();

    expect(planes.length).toBeGreaterThan(1);
    });

    /*
    * Ningún nombre debe estar vacío.
    */
    it('ningun nombre debe estar vacio', () => {
    const planes = service.getPlanesDisponibles();

    planes.forEach(plan => {
        expect(plan.nombre.trim()).not.toEqual('');
    });
    });

 /*
 * Ninguna descripción debe estar vacía.
 */
it('ninguna descripcion debe estar vacia', () => {
  const planes = service.getPlanesDisponibles();

  planes.forEach(plan => {
    expect(plan.descripcion.length).toBeGreaterThan(0);
  });
});

/*
 * Todos los planes deben tener precio definido.
 */
it('todos los planes deben tener precio definido', () => {
  const planes = service.getPlanesDisponibles();

  planes.forEach(plan => {
    expect(plan.precio).toBeDefined();
  });
});

});