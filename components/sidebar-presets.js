/*
 * sidebar-presets.js — Definições de menu (presets) do <me-sidebar>.
 *
 * ISTO NÃO É UM COMPONENTE: não registra nenhuma tag <me-*>. É o arquivo
 * auxiliar do Sidebar.js que centraliza os conjuntos de itens de menu do
 * Minha Escala (por perfil). Fonte única de verdade: alterar um item aqui
 * reflete em TODOS os protótipos que usam o me-sidebar.
 *
 * Cada preset: { label, items: [{ key, icon, label, href }] }
 *   - key   : identificador estável do item (usado por active-item no me-sidebar)
 *   - icon  : nome MDI (https://pictogrammers.com/library/mdi/)
 *   - label : rótulo exibido
 *   - href  : destino do link (nos protótipos costuma ser "#")
 *
 * A primeira chave do objeto é o preset padrão (usado quando não há preset
 * definido nem valor persistido).
 */
export const SIDEBAR_PRESETS = {
  gestor: {
    label: 'Gestor',
    items: [
      { key: 'dashboard', icon: 'monitor', label: 'Dashboard', href: '#' },
      { key: 'escalas', icon: 'calendar-edit', label: 'Gerenciar Escalas', href: '#' },
      { key: 'politicas', icon: 'clipboard-text-outline', label: 'Políticas', href: '#' },
      { key: 'aprovacoes', icon: 'checkbox-multiple-outline', label: 'Aprovações', href: '#' },
      { key: 'unidades', icon: 'office-building-outline', label: 'Unidades', href: '#' },
      { key: 'consultar', icon: 'magnify', label: 'Consultar', href: '#' },
      { key: 'medicos', icon: 'doctor', label: 'Médicos', href: '#' },
      { key: 'relatorios', icon: 'invoice-list-outline', label: 'Relatórios', href: '#' },
      { key: 'usuarios', icon: 'account-group', label: 'Usuários', href: '#' },
    ],
  },
  medico: {
    label: 'Médico',
    items: [
      { key: 'minhas-escalas', icon: 'calendar', label: 'Minhas Escalas', href: '#' },
      { key: 'meus-plantoes', icon: 'clock-outline', label: 'Meus Plantões', href: '#' },
      { key: 'trocas', icon: 'swap-horizontal', label: 'Trocas', href: '#' },
      { key: 'documentos', icon: 'file-document-outline', label: 'Documentos', href: '#' },
      { key: 'perfil', icon: 'account-circle', label: 'Perfil', href: '#' },
    ],
  },
};
