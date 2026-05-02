import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PlanesPage } from './planes.page';
const routes: Routes = [{ path: '', component: PlanesPage }];
@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class PlanesPageRoutingModule { }
