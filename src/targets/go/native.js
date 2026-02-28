/**
 * @description
 * HTTP code snippet generator for native Go.
 *
 * @author
 * @montanaflynn
 *
 * for any questions or issues regarding the generated code snippet, please open an issue mentioning the author.
 */

'use strict'

const CodeBuilder = require('../../helpers/code-builder')

module.exports = function (source, options) {
  // Let's Go!
  const code = new CodeBuilder('\t')

  // Define Options
  const opts = Object.assign({
    showBoilerplate: true,
    checkErrors: false,
    printBody: true,
    timeout: -1
  }, options)

  const errorPlaceholder = opts.checkErrors ? 'err' : '_'

  const indent = opts.showBoilerplate ? 1 : 0

  const errorCheck = function () {
    if (opts.checkErrors) {
      code.push(indent, 'if err != nil {')
        .push(indent + 1, 'panic(err)')
        .push(indent, '}')
    }
  }

  const hasMultipart = source.postData.mimeType === 'multipart/form-data' && source.postData.params && source.postData.params.length > 0

  // Create boilerplate
  if (opts.showBoilerplate) {
    code.push('package main')
      .blank()
      .push('import (')
      .push(indent, '"fmt"')

    if (opts.timeout > 0) {
      code.push(indent, '"time"')
    }

    if (hasMultipart) {
      code.push(indent, '"bytes"')
      code.push(indent, '"mime/multipart"')
      code.push(indent, '"os"')
    }

    if (source.postData.text && !hasMultipart) {
      code.push(indent, '"strings"')
    }

    code.push(indent, '"net/http"')

    if (opts.printBody || hasMultipart) {
      code.push(indent, '"io"')
    }

    code.push(')')
      .blank()
      .push('func main() {')
      .blank()
  }

  // Create client
  let client
  if (opts.timeout > 0) {
    client = 'client'
    code.push(indent, 'client := http.Client{')
      .push(indent + 1, 'Timeout: time.Duration(%s * time.Second),', opts.timeout)
      .push(indent, '}')
      .blank()
  } else {
    client = 'http.DefaultClient'
  }

  code.push(indent, 'url := "%s"', source.fullUrl)
    .blank()

  // If we have body content or not create the var and reader or nil
  if (hasMultipart) {
    code.push(indent, 'body := &bytes.Buffer{}')
    code.push(indent, 'writer := multipart.NewWriter(body)')
    source.postData.params.forEach(function (param) {
      if (param.fileName) {
        code.push(indent, 'part, _ := writer.CreateFormFile("%s", "%s")', param.name, param.fileName || 'file')
        code.push(indent, 'file, _ := os.Open("%s")', param.fileName || 'file')
        code.push(indent, 'io.Copy(part, file)')
      } else {
        code.push(indent, 'writer.WriteField("%s", "%s")', param.name, (param.value || '').replace(/"/g, '\\"'))
      }
    })
    code.push(indent, 'writer.Close()')
    code.push(indent, 'req, %s := http.NewRequest("%s", url, body)', errorPlaceholder, source.method)
    code.push(indent, 'req.Header.Set("Content-Type", writer.FormDataContentType())')
    code.blank()
  } else if (source.postData.text) {
    code.push(indent, 'payload := strings.NewReader(%s)', JSON.stringify(source.postData.text))
      .blank()
      .push(indent, 'req, %s := http.NewRequest("%s", url, payload)', errorPlaceholder, source.method)
      .blank()
  } else {
    code.push(indent, 'req, %s := http.NewRequest("%s", url, nil)', errorPlaceholder, source.method)
      .blank()
  }

  errorCheck()

  // Add headers
  if (Object.keys(source.allHeaders).length) {
    Object.keys(source.allHeaders).forEach(function (key) {
      code.push(indent, 'req.Header.Add("%s", "%s")', key, source.allHeaders[key])
    })

    code.blank()
  }

  // Make request
  code.push(indent, 'res, %s := %s.Do(req)', errorPlaceholder, client)
  errorCheck()

  // Get Body (use resBody to avoid shadowing request body in multipart)
  if (opts.printBody) {
    code.blank()
      .push(indent, 'defer res.Body.Close()')
      .push(indent, 'resBody, %s := io.ReadAll(res.Body)', errorPlaceholder)
    errorCheck()
  }

  // Print it
  code.blank()
    .push(indent, 'fmt.Println(res)')

  if (opts.printBody) {
    code.push(indent, 'fmt.Println(string(resBody))')
  }

  // End main block
  if (opts.showBoilerplate) {
    code.blank()
      .push('}')
  }

  return code.join()
}

module.exports.info = {
  key: 'native',
  title: 'NewRequest',
  link: 'http://golang.org/pkg/net/http/#NewRequest',
  description: 'Golang HTTP client request'
}
