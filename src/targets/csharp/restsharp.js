'use strict'

const CodeBuilder = require('../../helpers/code-builder')
const helpers = require('../../helpers/headers')

module.exports = function (source, options) {
  const code = new CodeBuilder()
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

  if (methods.indexOf(source.method.toUpperCase()) === -1) {
    return 'Method not supported'
  } else {
    code.push('var client = new RestClient("%s");', source.fullUrl)
    code.push('var request = new RestRequest(Method.%s);', source.method.toUpperCase())
  }

  // Add headers, including the cookies
  const headers = Object.keys(source.headersObj)

  // construct headers
  if (headers.length) {
    headers.forEach(function (key) {
      code.push('request.AddHeader("%s", "%s");', key, source.headersObj[key])
    })
  }

  // construct cookies
  if (source.cookies.length) {
    source.cookies.forEach(function (cookie) {
      code.push('request.AddCookie("%s", "%s");', cookie.name, cookie.value)
    })
  }

  if (source.postData.mimeType === 'multipart/form-data' && source.postData.params && source.postData.params.length > 0) {
    source.postData.params.forEach(function (param) {
      if (param.fileName) {
        code.push('request.AddFile("%s", "%s", "%s");', param.name, param.fileName || 'file', param.contentType || 'application/octet-stream')
      } else {
        code.push('request.AddParameter("%s", %s, ParameterType.GetOrPost);', param.name, JSON.stringify(param.value || ''))
      }
    })
  } else if (source.postData.text) {
    code.push(
      'request.AddParameter("%s", %s, ParameterType.RequestBody);',
      helpers.getHeader(source.allHeaders, 'content-type') || 'application/octet-stream',
      JSON.stringify(source.postData.text)
    )
  }

  code.push('IRestResponse response = client.Execute(request);')
  return code.join()
}

module.exports.info = {
  key: 'restsharp',
  title: 'RestSharp',
  link: 'http://restsharp.org/',
  description: 'Simple REST and HTTP API Client for .NET'
}
