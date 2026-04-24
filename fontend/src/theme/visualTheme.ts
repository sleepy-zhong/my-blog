export type ThemeId = 'nebula' | 'sunset' | 'ice' | 'laser' | 'volt' | 'bloom' | 'mint'

export interface ThemeOption {
  id: ThemeId
  label: string
}

export const defaultThemeId: ThemeId = 'nebula'

export const themeOptions: ThemeOption[] = [
  { id: 'nebula', label: 'Neon' },
  { id: 'sunset', label: 'Ember' },
  { id: 'ice', label: 'Aqua' },
  { id: 'laser', label: 'Laser' },
  { id: 'volt', label: 'Volt' },
  { id: 'bloom', label: 'Bloom' },
  { id: 'mint', label: 'Mint' }
]

export const themeVars: Record<ThemeId, Record<string, string>> = {
  nebula: {
    '--bg-1': '#05060c',
    '--bg-2': '#0d101b',
    '--bg-3': '#1a1020',
    '--panel': 'rgba(7, 10, 18, 0.74)',
    '--panel-strong': 'rgba(5, 7, 14, 0.88)',
    '--panel-soft': 'rgba(255, 255, 255, 0.05)',
    '--panel-glow': 'rgba(54, 255, 224, 0.16)',
    '--line': 'rgba(62, 246, 223, 0.18)',
    '--line-strong': 'rgba(255, 79, 216, 0.28)',
    '--text': '#f5f7ff',
    '--muted': '#97a0bf',
    '--accent': '#36ffe0',
    '--accent-2': '#ff4fd8',
    '--accent-3': '#ff9a3d',
    '--danger': '#ff6e8f',
    '--success': '#6dffc6',
    '--warning': '#ffd06b',
    '--glow': 'rgba(54, 255, 224, 0.38)'
  },
  sunset: {
    '--bg-1': '#090406',
    '--bg-2': '#17070f',
    '--bg-3': '#25100b',
    '--panel': 'rgba(13, 8, 14, 0.74)',
    '--panel-strong': 'rgba(10, 6, 12, 0.88)',
    '--panel-soft': 'rgba(255, 255, 255, 0.05)',
    '--panel-glow': 'rgba(255, 115, 70, 0.18)',
    '--line': 'rgba(255, 164, 78, 0.18)',
    '--line-strong': 'rgba(255, 80, 133, 0.28)',
    '--text': '#fff4f2',
    '--muted': '#d5a8b0',
    '--accent': '#ff7c4d',
    '--accent-2': '#ff4f85',
    '--accent-3': '#ffbf47',
    '--danger': '#ff7f89',
    '--success': '#ffd56d',
    '--warning': '#ffd56d',
    '--glow': 'rgba(255, 124, 77, 0.38)'
  },
  ice: {
    '--bg-1': '#04080c',
    '--bg-2': '#07121a',
    '--bg-3': '#0e1b1b',
    '--panel': 'rgba(6, 12, 17, 0.74)',
    '--panel-strong': 'rgba(5, 9, 14, 0.88)',
    '--panel-soft': 'rgba(255, 255, 255, 0.05)',
    '--panel-glow': 'rgba(53, 226, 255, 0.18)',
    '--line': 'rgba(86, 255, 226, 0.18)',
    '--line-strong': 'rgba(53, 226, 255, 0.28)',
    '--text': '#effcff',
    '--muted': '#95bbc3',
    '--accent': '#35e2ff',
    '--accent-2': '#64ffcf',
    '--accent-3': '#a8ff60',
    '--danger': '#86e8ff',
    '--success': '#8bffda',
    '--warning': '#d9ff8d',
    '--glow': 'rgba(53, 226, 255, 0.38)'
  },
  laser: {
    '--bg-1': '#f6fbff',
    '--bg-2': '#e8f4ff',
    '--bg-3': '#d9e7ff',
    '--panel': 'rgba(255, 255, 255, 0.76)',
    '--panel-strong': 'rgba(248, 252, 255, 0.92)',
    '--panel-soft': 'rgba(8, 36, 73, 0.06)',
    '--panel-glow': 'rgba(0, 174, 255, 0.22)',
    '--line': 'rgba(0, 122, 255, 0.2)',
    '--line-strong': 'rgba(132, 77, 255, 0.28)',
    '--text': '#07162c',
    '--muted': '#46617e',
    '--accent': '#008cff',
    '--accent-2': '#8a3ffc',
    '--accent-3': '#00d8ff',
    '--danger': '#ff78cb',
    '--success': '#00bfa6',
    '--warning': '#ffb703',
    '--glow': 'rgba(0, 140, 255, 0.34)'
  },
  volt: {
    '--bg-1': '#fbffe8',
    '--bg-2': '#eaffb7',
    '--bg-3': '#c6ffe4',
    '--panel': 'rgba(255, 255, 245, 0.78)',
    '--panel-strong': 'rgba(250, 255, 231, 0.94)',
    '--panel-soft': 'rgba(42, 70, 0, 0.07)',
    '--panel-glow': 'rgba(182, 255, 0, 0.28)',
    '--line': 'rgba(92, 190, 0, 0.22)',
    '--line-strong': 'rgba(0, 210, 168, 0.28)',
    '--text': '#152000',
    '--muted': '#52652a',
    '--accent': '#7bd900',
    '--accent-2': '#00c9a7',
    '--accent-3': '#18a0ff',
    '--danger': '#ff9a7a',
    '--success': '#2bbf4b',
    '--warning': '#d7b900',
    '--glow': 'rgba(123, 217, 0, 0.36)'
  },
  bloom: {
    '--bg-1': '#fff8fb',
    '--bg-2': '#ffe7f0',
    '--bg-3': '#fff0cc',
    '--panel': 'rgba(255, 255, 255, 0.82)',
    '--panel-strong': 'rgba(255, 250, 253, 0.95)',
    '--panel-soft': 'rgba(138, 45, 76, 0.07)',
    '--panel-glow': 'rgba(255, 88, 145, 0.2)',
    '--line': 'rgba(255, 108, 156, 0.22)',
    '--line-strong': 'rgba(255, 160, 64, 0.3)',
    '--text': '#351122',
    '--muted': '#86536b',
    '--accent': '#ff4f9a',
    '--accent-2': '#ff9f43',
    '--accent-3': '#ffd166',
    '--danger': '#ff7ea6',
    '--success': '#14b88a',
    '--warning': '#ffe48c',
    '--glow': 'rgba(255, 79, 154, 0.32)'
  },
  mint: {
    '--bg-1': '#ffffff',
    '--bg-2': '#f2fff8',
    '--bg-3': '#ddfff0',
    '--panel': 'rgba(255, 255, 255, 0.84)',
    '--panel-strong': 'rgba(255, 255, 255, 0.96)',
    '--panel-soft': 'rgba(0, 119, 95, 0.06)',
    '--panel-glow': 'rgba(0, 214, 161, 0.18)',
    '--line': 'rgba(0, 169, 139, 0.2)',
    '--line-strong': 'rgba(0, 198, 154, 0.3)',
    '--text': '#06251e',
    '--muted': '#47766a',
    '--accent': '#00b894',
    '--accent-2': '#9be15d',
    '--accent-3': '#00c2ff',
    '--danger': '#ffa58f',
    '--success': '#00b894',
    '--warning': '#dbff8c',
    '--glow': 'rgba(0, 184, 148, 0.28)'
  }
}

export function isThemeId(value: unknown): value is ThemeId {
  return value === 'nebula'
    || value === 'sunset'
    || value === 'ice'
    || value === 'laser'
    || value === 'volt'
    || value === 'bloom'
    || value === 'mint'
}
