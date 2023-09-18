{ pkgs ? import <nixpkgs> {} }:
  pkgs.mkShell {
    # nativeBuildInputs is usually what you want -- tools you need to run
    nativeBuildInputs = [ pkgs.nodejs pkgs.nodePackages.typescript pkgs.python3 pkgs.nodePackages.node-gyp pkgs.pixman pkgs.pkg-config pkgs.cairo pkgs.pango];
}

