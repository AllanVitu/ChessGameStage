/// <reference types="vite/client" />


/// Import du module Vue, pour que ts l'interprète ///
declare module '*.vue' {
    import type { DefineComponent } from "vue";
    const component: DefineComponent<{}, {}, any>
    export default component
}
