// grilla de aplicacion start
export interface AppGrillaModel {
    value: AppValue;
    statusCode: number;
    hasSucceeded: boolean;
  }
  export interface AppValue {
    total_paginas: number;
    total_registros: number;
    data: AppDatos[];
  }
  export interface AppDatos {
    i_ID_APLICATION: number;
    v_APLICATION: string;
    v_ACRONYM: Date;
    v_LEVEL_CRITICALITY: string;
    d_DATE_CREATE: Date;
    b_STATE: string;
  }
// grilla de aplicacion end
// create app - start
export interface CreateApp {
  v_APLICATION: string;
  v_ACRONYM: string;
  v_DESCRIPTION: string;
  i_LEVEL_CRITICAL: number;
  fILE_IMAGE: File;
  v_RUTA: string;
  v_URL: string;
}
// create app - end
// update app - start
export interface UpdateApp {
  i_APLICATION: number;
  v_APLICATION: string;
  v_ACRONYM: string;
  v_DESCRIPTION: string;
  i_LEVEL_CRITICAL: number;
  fILE_IMAGE: File;
  v_ROUTE: string;
  v_URL: string;
}
// update app - end
// obtener un aplicativo - start
export interface ResponseGetAplication {
  value: GetAplicationValue;
  statusCode: number;
  hasSucceeded: Boolean;
}
export interface GetAplicationValue {
  i_APLICATION_ID: number;
  v_APLICATION: string;
  v_ACRONYM: string;
  v_DESCRIPTION: string;
  i_CRITICALITY_LEVEL: number;
  v_CRITICALITY_LEVEL: string;
  v_IMAGE: string;
  v_ROUTE: string;
  v_URL: string;
  b_STATE: string;
  d_DATE_CREATE: string;
  view_list_menu: List_menu_app[];
}
// obtener un aplicativo - end
// add menu - start
export interface Menu_app {
  i_APLICATION_ID: number;
  v_List_menu_app:  List_menu_app[];
}
export interface List_menu_app {
  i_MENU_ID: number;
  v_NAME_MENU: string;
  v_ICON: string;
  v_ROUTE_MENU: string;
  v_URL_MENU: string;
  v_TITLE: string;
  v_List_submenu: List_submenu_app[];
}
export interface List_submenu_app {
  i_MENU_ID: number;
  v_NAME_MENU: string;
  v_ICON: string;
  v_ROUTE_MENU: string;
  v_URL_MENU: string;
  v_TITLE: string;
  v_List_subsubmenu: List_submenu_app[];
}
// add menu - end
// get list nivel criticidad - start
export interface ResponseGetLevelCriticalityApp {
  value: ListLevelCriticalityApp[];
  statusCode: number;
  hasSucceeded: Boolean;
}
export interface ListLevelCriticalityApp {
  i_ID_LEVEL: number;
  v_LEVEL: string;
  b_STATE: string;
}