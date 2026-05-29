self.addEventListener('message', async (event) => {
  self.postMessage({ id: event.data?.id, error: 'Worker imposition requires module-specific registration from the UI.' })
})
