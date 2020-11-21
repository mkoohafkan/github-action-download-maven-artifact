import Base64 from 'base-64'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { setFailed, setOutput } from '@actions/core'

export const downloadArtifact = (props) => {
    const {
        url,
        repository,
        groupId,
        artifactId,
        version,
        extension,
        classifier,
        username,
        password
    } = props

    const downloadUrl = getDownloadUrl(url, repository, groupId, artifactId, version, classifier, extension)
    const filename = getFileName(artifactId, version, classifier, extension)

    const filepath = ('/tmp/' + uuidv4() + '/' + filename)
    const headers = {
        Authorization: 'Basic ' + Base64.encode(username + ':' + password)
    }

    const options = {
        method: 'GET',
        headers: headers,
        redirect: 'follow'
    }
    downloadFile(downloadUrl, filepath, options)
}

const downloadFile = (url, filepath, options) => {
    fs.promises.mkdir(path.dirname(filepath), { recursive: true })
        .then(() => {
            const fileStream = fs.createWriteStream(filepath)
            fileStream.on('ready', () => {
                fetch(url, options)
                    .then(response => {
                        if (response.status < 400) {
                            response.body.pipe(fileStream)
                            fileStream.on('finish', () => {
                                setOutput('file', filepath)
                                fileStream.close()
                            })
                            fileStream.on('error', () => {
                                handleError()
                                fileStream.close()
                            })
                        } else {
                            const errorMessage = `HTTP ${response.status} - Error: ${response?.statusText ?? 'Error downloading file'}`
                            handleError(errorMessage)
                        }
                    })
                    .then(data => data)
                    .catch(error => handleError(error))
            })
        })
        .catch(console.error)
}

const handleError = (error) => {
    setFailed(error ?? 'Error downloading file')
    setOutput('file', undefined)
}

const getDownloadUrl = (url, repository, groupId, artifactId, version, classifier, extension) => (
    url + '/' +
    repository + '/' +
    groupId.replace(/\./g, '/') + '/' +
    artifactId + '/' +
    version + '/' +
    getFileName(artifactId, version, classifier, extension)
)

const getFileName = (artifactId, version, classifier, extension) => (
    artifactId + '-' +
    version + (classifier ? '-' : '.') +
    (classifier ?? '') + (classifier ? '.' : '') +
    extension
)
