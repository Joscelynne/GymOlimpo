import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { UserCredential } from '@firebase/auth-types';
import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private auth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {}

  async register({ rut, nombre, apellido, telefono, email, password }: any): Promise<UserCredential> {
    const credential = await this.auth.createUserWithEmailAndPassword(email, password);

    if (!credential.user) {
      throw new Error('No se pudo registrar el usuario');
    }

    await credential.user.updateProfile({
      displayName: `${nombre} ${apellido}`
    });

    await this.saveUserProfile(credential.user.uid, {
         rut,
        nombre,
        apellido,
        telefono: telefono || '',
        email,
        rol: 'cliente',
        planActivo: '',
        planId: '',
        precioPlan: 0,
        sesionesTotales: 0,
        sesionesDisponibles: 0,
        vigenciaInicio: '',
        vigenciaFin: '',
        provider: 'password',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
   });

    return credential;
  }

  async login({ email, password }: any): Promise<UserCredential> {
    return await this.auth.signInWithEmailAndPassword(email, password);
  }

  async loginWithGoogle(): Promise<UserCredential> {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const credential = await this.auth.signInWithPopup(provider);

    if (!credential.user) {
      throw new Error('No se pudo autenticar con Google');
    }

    const fullName = credential.user.displayName || '';
    const [nombre = '', ...resto] = fullName.split(' ');
    const apellido = resto.join(' ');

    await this.saveUserProfile(
      credential.user.uid,
     {
        nombre,
        apellido,
        email: credential.user.email || '',
        telefono: credential.user.phoneNumber || '',
        provider: 'google',
        rol: 'cliente',
        planActivo: '',
        planId: '',
        precioPlan: 0,
        sesionesTotales: 0,
        sesionesDisponibles: 0,
        vigenciaInicio: '',
        vigenciaFin: '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    },
    true
  );

    return credential;
  }

  async logout(): Promise<void> {
    return await this.auth.signOut();
  }

  getCurrentUser() {
    return this.auth.authState;
  }

  getUserProfile(uid: string) {
    return this.firestore.collection('users').doc(uid).valueChanges();
  }

  private async saveUserProfile(uid: string, data: any, merge = false): Promise<void> {
    await this.firestore.collection('users').doc(uid).set(data, { merge });
  }
}