'use strict'

const CodeBuilder = require('../../helpers/code-builder')

module.exports = function (source, options) {
  const code = new CodeBuilder()

  code.push('CURL *hnd = curl_easy_init();')
    .blank()
    .push('curl_easy_setopt(hnd, CURLOPT_CUSTOMREQUEST, "%s");', source.method.toUpperCase())
    .push('curl_easy_setopt(hnd, CURLOPT_URL, "%s");', source.fullUrl)

  // Add headers, including the cookies
  const headers = Object.keys(source.headersObj)

  // construct headers
  if (headers.length) {
    code.blank()
      .push('struct curl_slist *headers = NULL;')

    headers.forEach(function (key) {
      code.push('headers = curl_slist_append(headers, "%s: %s");', key, source.headersObj[key])
    })

    code.push('curl_easy_setopt(hnd, CURLOPT_HTTPHEADER, headers);')
  }

  // construct cookies
  if (source.allHeaders.cookie) {
    code.blank()
      .push('curl_easy_setopt(hnd, CURLOPT_COOKIE, "%s");', source.allHeaders.cookie)
  }

  if (source.postData.mimeType === 'multipart/form-data' && source.postData.params && source.postData.params.length > 0) {
    code.blank()
      .push('curl_mime *mime = curl_mime_init(hnd);')
    source.postData.params.forEach(function (param) {
      code.push('curl_mime_part *part = curl_mime_addpart(mime);')
      code.push('curl_mime_name(part, "%s");', param.name)
      if (param.fileName) {
        code.push('curl_mime_filedata(part, "%s");', param.fileName || 'file')
        if (param.contentType) {
          code.push('curl_mime_type(part, "%s");', param.contentType)
        }
      } else {
        code.push('curl_mime_data(part, "%s", CURL_ZERO_TERMINATED);', (param.value || '').replace(/"/g, '\\"'))
      }
    })
    code.push('curl_easy_setopt(hnd, CURLOPT_MIMEPOST, mime);')
  } else if (source.postData.text) {
    code.blank()
      .push('curl_easy_setopt(hnd, CURLOPT_POSTFIELDS, %s);', JSON.stringify(source.postData.text))
  }

  code.blank()
    .push('CURLcode ret = curl_easy_perform(hnd);')

  return code.join()
}

module.exports.info = {
  key: 'libcurl',
  title: 'Libcurl',
  link: 'http://curl.haxx.se/libcurl/',
  description: 'Simple REST and HTTP API Client for C'
}
