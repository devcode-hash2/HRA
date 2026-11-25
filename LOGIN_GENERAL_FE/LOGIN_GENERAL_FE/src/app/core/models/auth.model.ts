
// listado de aplicaciones del usuario start
export interface ResponseListaApp {
  value: valueListApp[];
  statusCode: number;
  hasSucceeded: boolean;
}
export interface valueListApp {
  aplicaciones: aplicaciones;
}
export interface aplicaciones {
  id_app: string;
  application: string;
  acronym: string;
  image: string | null;
  ruta: string | null;
  url: string | null;
  rol: string;
}

// menu start
export interface ResponseMenuApp {
  value: MenuApp[];
  statusCode: number;
  hasSucceeded: boolean;
}
export interface MenuApp {
  id_menu: number;
  nameMenu?: string;  
  icon?: string;
  ruta: string;
  url?: string;
  titulo?: string;
  orden?: string;
  permiso: Permiso;
  sub_menu: SubMenu[];
}
export interface SubMenu {
  id_menu: number;
  name: string;  
  icon?: string | null;
  ruta: string;
  url?: string;
  titulo?: string;
  orden?: string;
  permiso?: Permiso;
}
export interface Permiso {
  create: number;
  read: number;
  update: number;
  delete: number;
}
// menu end

export interface ResponseLogin {
  value: valueLogin;
  statusCode: number;
  hasSucceeded: boolean;
}
export interface valueLogin {
  access_Token: string;
  refresh_Token?: string;
}

export interface ProfileApp {
  idUser: number;
  idApp: string;
  application: string;
  acronym: string;
  role: string;
  idRol: string;
}

export interface UserByToken {
  id: number;
  user: string;
  changepassword: string;
}
export interface ResponseProfile {
  value: Profile;
  statusCode: number;
  hasSucceeded: boolean;
}
export interface Profile {
  numberDni: string;
  firstName: string;
  secondName: string;
  paternal_surname: string;
  maternal_surname: string;
  position: string;
  sex: number;
  image: string;
}

export interface UpdateUser {
  v_ID_USER?: string;
  v_PREVIOUS_PASSWORD?: string;
  v_NEW_PASSWORD?: string;
  v_REPEAT_PASSWORD?: string;
}
export interface ResponseGetTokenApp {
  value: string;
  statusCode: number;
  hasSucceeded: boolean;
}

export interface ResponseTimeNowServe {
  value: number;
  statusCode: number;
  hasSucceeded: boolean;
}
