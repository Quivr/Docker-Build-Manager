# Docker Build Manager

## Installation

- Install the package: `npm install -g @quivr/docker-build-manager`

- Docker should be installed and added to the path (`docker images` should work in the command line).

## Usage

In the root of the repo, run `dbm ubp <imagename>`: Updates (increases version number), builds and pushes the image.

`dbm update <imagename>`, `dbm build <imagename>` and `dbm push <imagename>` also exist seperately.
