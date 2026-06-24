import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GymService, PlanGym } from 'src/app/services/gym.service';
import { ToastController, AlertController } from '@ionic/angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-planes-admin',
  templateUrl: './planes-admin.page.html',
  styleUrls: ['./planes-admin.page.scss']
})
export class PlanesAdminPage implements OnInit {
  form: FormGroup;
  customPlanes$: Observable<PlanGym[]>;
  guardando = false;

  descripcionList: string[] = [];
  detallesList: string[] = [];

  // Valores temporales para bullets dinámicos
  nuevaDescripcion = '';
  nuevoDetalle = '';

  constructor(
    private fb: FormBuilder,
    private gymService: GymService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      precio: [null, [Validators.required, Validators.min(0)]],
      tipo: ['clase', Validators.required],
      sesiones: [12, [Validators.required, Validators.min(1)]],
      duracionMeses: [1, [Validators.required, Validators.min(1)]],
      recomendado: [false],
      linkFlow: ['']
    });

    this.customPlanes$ = this.gymService.getPlanesCustom();
  }

  ngOnInit() {
    this.form.get('tipo')?.valueChanges.subscribe(tipo => {
      const sesionesControl = this.form.get('sesiones');
      const duracionControl = this.form.get('duracionMeses');

      if (tipo === 'clase') {
        sesionesControl?.setValidators([Validators.required, Validators.min(1)]);
        duracionControl?.clearValidators();
      } else {
        duracionControl?.setValidators([Validators.required, Validators.min(1)]);
        sesionesControl?.clearValidators();
      }
      sesionesControl?.updateValueAndValidity();
      duracionControl?.updateValueAndValidity();
    });
  }

  addDescripcionBullet() {
    const val = this.nuevaDescripcion.trim();
    if (val) {
      this.descripcionList.push(val);
      this.nuevaDescripcion = '';
    }
  }

  removeDescripcionBullet(index: number) {
    this.descripcionList.splice(index, 1);
  }

  addDetalleBullet() {
    const val = this.nuevoDetalle.trim();
    if (val) {
      this.detallesList.push(val);
      this.nuevoDetalle = '';
    }
  }

  removeDetalleBullet(index: number) {
    this.detallesList.splice(index, 1);
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.descripcionList.length === 0) {
      this.showToast('Debes agregar al menos una característica en la descripción', 'warning');
      return;
    }

    this.guardando = true;
    try {
      const values = this.form.value;
      const nuevoPlan: Omit<PlanGym, 'id'> = {
        nombre: values.nombre,
        precio: Number(values.precio),
        sesiones: values.tipo === 'clase' ? Number(values.sesiones) : 1,
        tipo: values.tipo,
        recomendado: !!values.recomendado,
        linkFlow: values.linkFlow || '',
        descripcion: [...this.descripcionList]
      };

      if (values.tipo === 'asesoria') {
        nuevoPlan.duracionMeses = Number(values.duracionMeses);
        if (this.detallesList.length > 0) {
          nuevoPlan.detalles = [...this.detallesList];
        }
      }

      await this.gymService.crearPlanCustom(nuevoPlan);
      this.showToast('Plan personalizado creado exitosamente.', 'success');
      this.limpiarFormulario();
    } catch (error: any) {
      console.error(error);
      this.showToast('Error al guardar el plan: ' + error.message, 'danger');
    } finally {
      this.guardando = false;
    }
  }

  limpiarFormulario() {
    this.form.reset({
      nombre: '',
      precio: null,
      tipo: 'clase',
      sesiones: 12,
      duracionMeses: 1,
      recomendado: false,
      linkFlow: ''
    });
    this.descripcionList = [];
    this.detallesList = [];
    this.nuevaDescripcion = '';
    this.nuevoDetalle = '';
  }

  async eliminarPlan(plan: PlanGym) {
    const confirmed = await this.confirmarEliminacion(plan);
    if (!confirmed) return;

    try {
      await this.gymService.eliminarPlanCustom(plan.id);
      this.showToast(`El plan "${plan.nombre}" ha sido eliminado.`, 'success');
    } catch (error: any) {
      console.error(error);
      this.showToast('Error al eliminar el plan: ' + error.message, 'danger');
    }
  }

  private async confirmarEliminacion(plan: PlanGym): Promise<boolean> {
    return new Promise(async resolve => {
      const alert = await this.alertCtrl.create({
        header: 'Eliminar Plan',
        message: `¿Estás seguro de que deseas eliminar el plan personalizado <strong>${plan.nombre}</strong>? Esto no se puede deshacer.`,
        cssClass: 'gym-alert',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Sí, eliminar',
            role: 'confirm',
            handler: () => resolve(true)
          }
        ]
      });
      await alert.present();
    });
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
