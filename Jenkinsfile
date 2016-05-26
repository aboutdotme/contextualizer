node {
    service = 'contextualizer'
    build.init {}

    stage 'Build'
    compose.build {}

    stage 'Test'
    compose.test {}

    build.success {}
}

