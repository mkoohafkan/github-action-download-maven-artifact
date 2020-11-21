import { downloadArtifact } from './repository'
import { setFailed } from '@actions/core'
import { getProps } from './input'

try {
    downloadArtifact(getProps())
} catch (error) {
    setFailed(error.message)
}
