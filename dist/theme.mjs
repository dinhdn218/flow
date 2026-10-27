export function resolveTheme(storage,prefersDark=false){try{const saved=storage.getItem('flow.theme.v1');if(saved==='light'||saved==='dark')return saved;}catch{}return prefersDark?'dark':'light';}
export function changeTheme(current,storage){const theme=current==='dark'?'light':'dark';try{storage.setItem('flow.theme.v1',theme);}catch{}return theme;}
