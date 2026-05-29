self.addEventListener('message', (event) => {
  const pdf = event.data?.pdf || {}
  self.postMessage({ id: event.data?.id, result: { pageCount: pdf.pageCount || 0, checkedAt: new Date().toISOString() } })
})
