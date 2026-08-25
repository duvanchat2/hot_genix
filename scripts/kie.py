#!/usr/bin/env python3
"""
Paso 5 del pipeline: genera las imágenes de la landing con kie.ai.

    python3 scripts/kie.py --check
    python3 scripts/kie.py --course <slug>
    python3 scripts/kie.py --course <slug> --solo hero-fondo
    python3 scripts/kie.py --course <slug> --dry-run

Lee courses/<slug>/assets.json, genera lo que falte y descarga los PNG a
courses/<slug>/assets/. Escribe la URL y la ruta local de vuelta en assets.json,
así que volver a lanzarlo NO regenera lo ya hecho (usa --forzar para eso).

Clave: variable KIEAI_API_KEY o el archivo ~/.config/kieai/api-key.
Nunca se escribe la clave en el repo.
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BASE = os.environ.get("KIEAI_API_BASE", "https://api.kie.ai/api/v1")

# Catálogo curado. El precio es por imagen y en USD; sale del catálogo público de kie.ai
# y conviene revisarlo de vez en cuando porque cambia.
MODELOS = {
    "flux2-pro":    {"id": "flux-2/pro-text-to-image",     "usd": 0.025, "para": "fondos y escenas"},
    "seedream-4-5": {"id": "seedream/4.5-text-to-image",   "usd": 0.033, "para": "volumen barato"},
    "nano-banana":  {"id": "google/nano-banana-pro",       "usd": 0.09,  "para": "premium, retrato"},
    "ideogram-v3":  {"id": "ideogram/v3-text-to-image",    "usd": 0.035, "para": "texto dentro de la imagen"},
    "imagen4-ultra":{"id": "google/imagen4-ultra",         "usd": 0.06,  "para": "premium alternativo"},
    "quitar-fondo": {"id": "recraft/remove-background",    "usd": 0.005, "para": "recortes"},
    "upscale":      {"id": "topaz/image-upscale",          "usd": 0.10,  "para": "subir a 4K"},
}

MODELO_POR_DEFECTO = "flux2-pro"


class KieError(Exception):
    pass


def api_key() -> str:
    clave = os.environ.get("KIEAI_API_KEY")
    if clave:
        return clave.strip()
    archivo = Path.home() / ".config" / "kieai" / "api-key"
    if archivo.exists():
        return archivo.read_text(encoding="utf-8").strip()
    raise KieError(
        "Sin clave de kie.ai. Define KIEAI_API_KEY o guárdala en ~/.config/kieai/api-key "
        "(chmod 600). Nunca la pongas en el repo."
    )


def pedir(ruta: str, cuerpo=None, metodo="GET"):
    url = f"{BASE}{ruta}"
    datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
    req = urllib.request.Request(url, data=datos, method=metodo)
    req.add_header("Authorization", f"Bearer {api_key()}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        detalle = e.read().decode(errors="replace")[:400]
        if e.code == 401:
            raise KieError("kie.ai rechazó la clave (401). ¿La rotaste sin actualizarla aquí?")
        if e.code == 402:
            raise KieError("Sin créditos en kie.ai (402). Recarga la cuenta.")
        raise KieError(f"kie.ai respondió {e.code}: {detalle}")
    except urllib.error.URLError as e:
        raise KieError(
            f"No se pudo contactar con {url}: {e.reason}\n"
            "Si estás en Claude Code web, api.kie.ai tiene que estar permitido en la "
            "política de red del entorno; por defecto sale 403."
        )


def creditos():
    return pedir("/chat/credit")


def lanzar_tarea(modelo: str, prompt: str, params: dict) -> str:
    if modelo not in MODELOS:
        raise KieError(f"Modelo '{modelo}' desconocido. Opciones: {', '.join(MODELOS)}")
    cuerpo = {"model": MODELOS[modelo]["id"], "input": {"prompt": prompt, **params}}
    r = pedir("/jobs/createTask", cuerpo, metodo="POST")
    task_id = (r.get("data") or {}).get("taskId") or r.get("taskId")
    if not task_id:
        raise KieError(f"kie.ai no devolvió taskId: {json.dumps(r)[:300]}")
    return task_id


def esperar(task_id: str, timeout=300, intervalo=4):
    limite = time.time() + timeout
    while time.time() < limite:
        r = pedir(f"/jobs/recordInfo?taskId={task_id}")
        datos = r.get("data") or {}
        estado = (datos.get("state") or datos.get("status") or "").lower()
        if estado in ("success", "succeeded", "completed"):
            return datos
        if estado in ("fail", "failed", "error"):
            raise KieError(f"La generación falló: {datos.get('failMsg') or json.dumps(datos)[:300]}")
        time.sleep(intervalo)
    raise KieError(f"Timeout tras {timeout}s esperando la tarea {task_id}.")


def urls_del_resultado(datos) -> list:
    """kie.ai ha usado varias formas para devolver las URLs; se aceptan todas."""
    salida = datos.get("resultJson") or datos.get("result") or datos
    if isinstance(salida, str):
        try:
            salida = json.loads(salida)
        except json.JSONDecodeError:
            return [salida] if salida.startswith("http") else []
    for clave in ("resultUrls", "imageUrls", "urls", "images", "output"):
        v = (salida or {}).get(clave) if isinstance(salida, dict) else None
        if isinstance(v, list) and v:
            return [x if isinstance(x, str) else x.get("url", "") for x in v]
        if isinstance(v, str) and v.startswith("http"):
            return [v]
    return []


def descargar(url: str, destino: Path):
    destino.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=120) as r, open(destino, "wb") as f:
        f.write(r.read())
    return destino


def cargar_assets(slug: str):
    ruta = RAIZ / "courses" / slug / "assets.json"
    if not ruta.exists():
        raise KieError(
            f"Falta {ruta}. Genera primero el plan de imágenes (paso 5): "
            'un JSON con {"imagenes": [{"id", "prompt", "modelo", "params"}]}.'
        )
    return ruta, json.loads(ruta.read_text(encoding="utf-8"))


def main():
    ap = argparse.ArgumentParser(description="Genera las imágenes de una landing con kie.ai")
    ap.add_argument("--course", "-c", help="slug del curso")
    ap.add_argument("--solo", help="generar solo la imagen con este id")
    ap.add_argument("--check", action="store_true", help="comprobar clave y saldo")
    ap.add_argument("--dry-run", action="store_true", help="mostrar qué se generaría y cuánto costaría")
    ap.add_argument("--forzar", action="store_true", help="regenerar aunque ya tenga archivo")
    ap.add_argument("--modelos", action="store_true", help="listar el catálogo")
    args = ap.parse_args()

    if args.modelos:
        for k, v in MODELOS.items():
            print(f"  {k:<14} ${v['usd']:<6} {v['para']}")
        return

    if args.check:
        print(json.dumps(creditos(), indent=2, ensure_ascii=False))
        return

    if not args.course:
        ap.error("hace falta --course <slug> (o --check / --modelos)")

    ruta_assets, assets = cargar_assets(args.course)
    imagenes = assets.get("imagenes", [])
    if args.solo:
        imagenes = [i for i in imagenes if i.get("id") == args.solo]
        if not imagenes:
            raise KieError(f"No hay ninguna imagen con id '{args.solo}' en assets.json")

    pendientes = [i for i in imagenes if args.forzar or not i.get("archivo")]
    coste = sum(MODELOS.get(i.get("modelo", MODELO_POR_DEFECTO), {}).get("usd", 0) for i in pendientes)

    print(f"{len(pendientes)} imagen(es) por generar · coste estimado ${coste:.3f}")
    for i in pendientes:
        print(f"  · {i['id']}  [{i.get('modelo', MODELO_POR_DEFECTO)}]  {i.get('prompt','')[:70]}")
    if args.dry_run or not pendientes:
        return

    dir_assets = RAIZ / "courses" / args.course / "assets"
    for img in pendientes:
        modelo = img.get("modelo", MODELO_POR_DEFECTO)
        print(f"\n→ {img['id']} ({modelo})")
        task_id = lanzar_tarea(modelo, img["prompt"], img.get("params", {}))
        datos = esperar(task_id)
        urls = urls_del_resultado(datos)
        if not urls:
            raise KieError(f"La tarea {task_id} terminó sin URLs: {json.dumps(datos)[:300]}")

        nombre = f"{img['id']}.png"
        descargar(urls[0], dir_assets / nombre)
        img["url"] = urls[0]
        img["archivo"] = nombre
        img["taskId"] = task_id
        # Se guarda tras cada imagen: si algo falla a mitad, no se pierde lo ya pagado.
        ruta_assets.write_text(json.dumps(assets, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"  ✓ assets/{nombre}")

    print(f"\nListo. {ruta_assets} actualizado.")


if __name__ == "__main__":
    try:
        main()
    except KieError as e:
        print(f"✗ {e}", file=sys.stderr)
        sys.exit(1)
