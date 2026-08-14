# 반려꾸러미 Storefront

## 로컬 실행

백엔드를 먼저 새 프로젝트 경로에서 실행합니다.

```shell
cd /Users/anseonghun/Documents/project/banryeo-kkurumi
docker compose -f compose.public.yml up -d --build
```

그다음 이 디렉터리에서 프론트를 실행합니다. 개발 서버는 기본적으로
`http://localhost:8080`으로 `/api` 요청을 프록시합니다.

```shell
npm install
npm run dev
```

백엔드 주소가 다르면 origin만 지정할 수 있습니다.

```shell
STOREFRONT_API_ORIGIN=http://localhost:18080 npm run dev
```

## 검증

```shell
npm test
npm run build
npm run e2e:live
```

`e2e:live`는 기본 배치에서
`/Users/anseonghun/Documents/project/banryeo-kkurumi`를 자동으로 찾습니다. 백엔드가
그 아래 `backend/`로 다시 배치되어도 자동 인식합니다. 다른 위치에서는 프로젝트
루트 또는 실제 백엔드 디렉터리를 지정합니다.

```shell
BANRYEO_BACKEND_ROOT=/path/to/banryeo-kkurumi npm run e2e:live
```

E2E 런타임은 `banryeo-q3-e2e-*` Compose 프로젝트만 사용하며, 완료 후 해당
컨테이너와 테스트 볼륨을 정리합니다.
