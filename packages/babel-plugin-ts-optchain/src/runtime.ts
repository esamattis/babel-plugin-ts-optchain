/**
 * Inspired by
 * https://github.com/burakcan/mb
 */
export function oc(data: any, path: string[], defaultValue?: any) {
    path.map(key => (data = (data || {})[key]));
    return data == null ? defaultValue : data;
}
