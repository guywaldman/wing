// Note this aims to test an internal implementation detail of how the JSII importer works:
// If we import a namespace from a JSII module which internally uses and defines types in another 
// namespace then we need to import that namespace as well but keep it hidden from user access.

bring fs; // Bring in stuff from from `fs` namespace which implicitly brings in stuff from `core` namespace.

new fs.TextFile("/tmp/test.txt"); // This should work because we brought in `fs`
new core.FileBase("/tmp/test.txt"); // This should fail even though `fs.TextFile` extends `core.FileBase` because we didn't bring in `core` explicitly.
