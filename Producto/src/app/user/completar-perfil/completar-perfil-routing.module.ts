import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CompletarPerfilPage } from './completar-perfil.page';

const routes: Routes = [
  {
    path: '',
    component: CompletarPerfilPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CompletarPerfilPageRoutingModule {}
