out vec3 interpolatedNormal;
attribute vec4 skinIndex; // length : 398880 ?
attribute vec4 skinWeight; // length : 398880 ?
//chaque sommet a un different skinindex et skinweight
//ce fichier prend compte de 1 sommet. gl position est 1 sommet.
uniform mat4 bones[12];

void main(){

    vec4 lbs = (skinWeight.x * bones[int(skinIndex.x)]
    + skinWeight.y * bones[int(skinIndex.y)]
    + skinWeight.z * bones[int(skinIndex.z)]
    + skinWeight.w * bones[int(skinIndex.w)])* vec4(position,1.0);

    interpolatedNormal = normal;
	gl_Position = projectionMatrix * modelViewMatrix * lbs;
}