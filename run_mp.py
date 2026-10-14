import asyncio,json,os
from playwright.async_api import async_playwright
async def main():
  m=json.load(open(os.path.expanduser("~/.cache/lovable-auth/session.json")))
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=True);pg=await (await b.new_context(viewport={"width":1280,"height":1800})).new_page()
    errs=[];pg.on("pageerror",lambda e:errs.append(str(e)))
    await pg.goto("http://localhost:8080");await pg.evaluate(f"localStorage.setItem({json.dumps(m['storage_key'])},{json.dumps(json.dumps(m['session']))})")
    await pg.goto("http://localhost:8080/mes-produits");await pg.wait_for_timeout(3500);print((await pg.inner_text("body"))[:300])
    await pg.goto("http://localhost:8080/admin");await pg.wait_for_timeout(3500)
    for l in ["Dépôts","Retraits"]:
      await pg.get_by_role("button",name=l,exact=True).first.click();await pg.wait_for_timeout(1500);print(l,(await pg.inner_text("main"))[:120])
    print("ERR",errs);await b.close()
asyncio.run(main())
