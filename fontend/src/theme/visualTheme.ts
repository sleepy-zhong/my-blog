export type ThemeId = 'nebula' | 'sunset' | 'ice'

export interface ThemeOption {
  id: ThemeId
  label: string
}

export const defaultThemeId: ThemeId = 'nebula'

export const themeOptions: ThemeOption[] = [
  { id: 'nebula', label: 'Neon' },
  { id: 'sunset', label: 'Ember' },
  { id: 'ice', label: 'Aqua' }
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
  }
}

export function isThemeId(value: unknown): value is ThemeId {
  return value === 'nebula' || value === 'sunset' || value === 'ice'
}
