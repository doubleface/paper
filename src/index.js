require('isomorphic-fetch')
const {
  BaseKonnector,
  requestFactory,
  saveFiles
} = require('cozy-konnector-libs')
let request

module.exports = new BaseKonnector(start)

async function start(fields) {
  const { access_token } = fields

  request = requestFactory({
    // debug: true,
    cheerio: false,
    json: true,
    auth: { bearer: access_token }
  })

  const { doc_ids } = await request.post(
    'https://api.dropboxapi.com/2/paper/docs/list'
  )
  for (const doc_id of doc_ids) {
    const resp = await request.post(
      'https://api.dropboxapi.com/2/paper/docs/download',
      {
        headers: {
          'Dropbox-API-Arg': JSON.stringify({
            doc_id,
            export_format: { '.tag': 'markdown' }
          })
        },
        resolveWithFullResponse: true
      }
    )

    const { title } = JSON.parse(resp.headers['dropbox-api-result'])
    const folderPath = await fetchFileFolderPath(doc_id)
    if (folderPath)
      console.log(`${folderPath.length ? folderPath + '/' : ''}${title}.md`)
    // await saveFiles([{ filestream: resp.body, filename: title }], fields)
  }
}

async function fetchFileFolderPath(fileId) {
  try {
    let { folders } = await request.post(
      'https://api.dropboxapi.com/2/paper/docs/get_folder_info',
      {
        body: { doc_id: fileId }
      }
    )
    folders = folders || []
    const filePath = folders.map(f => f.name).join('/')
    return filePath
  } catch (err) {
    return false
  }
}
