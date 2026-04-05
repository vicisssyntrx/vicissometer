/**
 * Update document head metadata dynamically (favicon, icons, theme-color)
 */

function updateLink(rel, href, type = null) {
  let link = document.querySelector(`link[rel="${rel}"]`)
  if (!link) {
    link = document.createElement('link')
    link.rel = rel
    if (type) link.type = type
    document.head.appendChild(link)
  }
  link.href = href
}

function updateMeta(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = name
    document.head.appendChild(meta)
  }
  meta.content = content
}

export function updateHead(logoUrl, themeColor = null) {
  if (logoUrl) {
    updateLink('icon', logoUrl, 'image/png')
    updateLink('apple-touch-icon', logoUrl)
  }
  if (themeColor) {
    updateMeta('theme-color', themeColor)
  }
}
